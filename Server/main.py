from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
import os
import shutil
from typing import Dict, Any, List
from dotenv import load_dotenv
from pathlib import Path

# Using the remote API embeddings class
from langchain_huggingface import HuggingFaceEndpointEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader

load_dotenv(dotenv_path=os.path.join(Path(__file__).resolve().parent, ".env"))

RAG_CHAINS: Dict[str, Any] = {}
model_name = "sentence-transformers/all-MiniLM-L6-v2"

EMBEDDINGS = HuggingFaceEndpointEmbeddings(
    repo_id=model_name,
    task="feature-extraction",
)

app = FastAPI()

FRONTEND_URL = "https://note-ai-beryl.vercel.app"
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
    """Selects the correct LangChain DocumentLoader based on file extension."""
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
    """Returns the status and active documents."""
    return {
        "Status": "Semantic Search Backend Running (LLM-Free)",
        "Embedding_Model": model_name,
        "Active_Docs": list(RAG_CHAINS.keys())
    }

@app.post("/process-docs")
async def process_docs(file: UploadFile = File(...)):
    """Handles file upload, splits text, creates embeddings, and stores the retriever."""
    file_path = f"temp_{file.filename}"

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        loader = get_document_loader(file_path)
        documents: List[Document] = loader.load()

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        texts = text_splitter.split_documents(documents)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document processing failed: {e}")
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

    # Create Chroma vectorstore and retriever
    vectorstore = Chroma.from_documents(texts, EMBEDDINGS)
    retriever = vectorstore.as_retriever(search_kwargs={"k": 4})

    doc_name = file.filename
    RAG_CHAINS[doc_name] = retriever

    return {"message": f"Successfully processed and indexed document: {doc_name}", "document_name": doc_name}

@app.post("/ask-doc")
async def ask_doc(query: QAQuery):
    doc_name = query.document_name
    question = query.question

    if doc_name not in RAG_CHAINS:
        raise HTTPException(status_code=404, detail=f"Document '{doc_name}' not found or not processed.")

    try:
        retriever = RAG_CHAINS[doc_name]

        relevant_documents: List[Document] = await run_in_threadpool(retriever.get_relevant_documents, question)

        context_text = "\n\n---\n\n".join([doc.page_content for doc in relevant_documents])
        sources = sorted(list(set([doc.metadata.get('source', 'N/A') for doc in relevant_documents])))

        return {
            "answer": f"Retrieved Context (Top {len(relevant_documents)} Chunks):\n\n{context_text}",
            "sources": sources,
            "document_name": doc_name
        }

    except Exception as e:
        print(f"Error during retrieval: {e}")
        raise HTTPException(status_code=500, detail=f"Retrieval failed: {e}")
    
@app.get("/health")
def health():
    return {"status": "ok"}
