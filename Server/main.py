from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
import os
import shutil
from typing import Dict, Any, List
from dotenv import load_dotenv
from pathlib import Path

# --- New Imports for Chat Handling ---
from langchain_huggingface import HuggingFaceEndpoint, HuggingFaceEndpointEmbeddings, ChatHuggingFace
from langchain_core.prompts import ChatPromptTemplate
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader

load_dotenv(dotenv_path=os.path.join(Path(__file__).resolve().parent, ".env"))

app = FastAPI()

# --- Configuration ---
RAG_CHAINS: Dict[str, Any] = {}

# 1. Embedding Model
embedding_model_name = "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDINGS = HuggingFaceEndpointEmbeddings(
    repo_id=embedding_model_name,
    task="feature-extraction",
)

# 2. LLM Model (The Fix: Conversational Setup)
llm_repo_id = "HuggingFaceH4/zephyr-7b-beta"

# We initialize the endpoint with task="conversational" to satisfy the API provider
endpoint = HuggingFaceEndpoint(
    repo_id=llm_repo_id,
    task="conversational", 
    max_new_tokens=512,
    do_sample=False,
    repetition_penalty=1.03,
)

# We wrap it in ChatHuggingFace so LangChain formats the messages correctly
llm = ChatHuggingFace(llm=endpoint)

# 3. Chat Prompt Template (Structured for Chat Models)
prompt_template = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful AI assistant. Use the context provided below to answer the user's question. If you don't know the answer, say so."),
    ("human", "Context:\n{context}\n\nQuestion: {question}")
])

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://note-ai-beryl.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QAQuery(BaseModel):
    document_name: str
    question: str

def get_document_loader(file_path: str):
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        return PyPDFLoader(file_path)
    elif ext == ".txt":
        return TextLoader(file_path)
    elif ext == ".docx":
        return Docx2txtLoader(file_path)
    raise ValueError(f"Unsupported file type: {ext}")


@app.get("/")
def read_root():
    return {
        "Status": "RAG Backend Running",
        "LLM_Model": llm_repo_id,
        "Active_Docs": list(RAG_CHAINS.keys())
    }

@app.post("/process-docs")
async def process_docs(file: UploadFile = File(...)):
    file_path = f"temp_{file.filename}"
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        loader = get_document_loader(file_path)
        documents: List[Document] = loader.load()

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        texts = text_splitter.split_documents(documents)

        vectorstore = Chroma.from_documents(texts, EMBEDDINGS)
        retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

        doc_name = file.filename
        RAG_CHAINS[doc_name] = retriever

        return {"message": f"Successfully processed: {doc_name}", "document_name": doc_name}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {e}")
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@app.post("/ask-doc")
async def ask_doc(query: QAQuery):
    doc_name = query.document_name
    question = query.question

    if doc_name not in RAG_CHAINS:
        raise HTTPException(status_code=404, detail=f"Document '{doc_name}' not found.")

    try:
        retriever = RAG_CHAINS[doc_name]
        relevant_documents = await run_in_threadpool(retriever.invoke, question)

        context_text = "\n\n".join([doc.page_content for doc in relevant_documents])
        sources = sorted(list(set([doc.metadata.get('source', 'N/A') for doc in relevant_documents])))

        # 4. Invoke using the Chat Chain
        # We create a chain: Prompt -> LLM
        chain = prompt_template | llm
        
        # Invoke the chain
        response = await run_in_threadpool(
            chain.invoke, 
            {"context": context_text, "question": question}
        )

        return {
            "answer": response.content.strip(), # 'content' holds the text in Chat messages
            "sources": sources,
            "document_name": doc_name
        }

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=f"Retrieval failed: {e}")

@app.get("/health")
def health():
    return {"status": "ok"}