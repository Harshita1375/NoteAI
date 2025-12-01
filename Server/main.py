from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import uvicorn
import shutil
from typing import Dict, Any, List

from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.documents import Document

# --- Configuration (Removed API Key Dependency) ---
RAG_CHAINS: Dict[str, Any] = {} # Stores retriever objects

# Initialize the free, local embedding model
# NOTE: This model will be downloaded once and run locally (no cost, no quota)
model_name = "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDINGS = HuggingFaceEmbeddings(model_name=model_name)

# --- FastAPI App Setup ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic model for the Q&A request body
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
        # 1. File Saving
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 2. Document Loading
        loader = get_document_loader(file_path)
        documents: List[Document] = loader.load()

        # 3. Splitting
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        texts = text_splitter.split_documents(documents)

    except Exception as e:
        # Catch and handle errors during file operations/loading
        raise HTTPException(status_code=500, detail=f"Document processing failed: {e}")
    finally:
        # 4. Cleanup (Always runs, even if an exception occurred)
        if os.path.exists(file_path):
             os.remove(file_path)

    # 5. Vector Store & Retriever Creation (The Core Semantic Search Index)
    vectorstore = Chroma.from_documents(texts, EMBEDDINGS)
    # The retriever is configured to fetch the top 4 most relevant chunks (k=4)
    retriever = vectorstore.as_retriever(search_kwargs={"k": 4})
    
    doc_name = file.filename
    # Store the retriever object in the global dictionary
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

        # NEW LangChain API – async version
        relevant_documents: List[Document] = await retriever.ainvoke(question)

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

if __name__ == "__main__":
    # Ensure you have 'pip install uvicorn' and 'pip install sentence-transformers'
    uvicorn.run(app, host="0.0.0.0", port=8000)