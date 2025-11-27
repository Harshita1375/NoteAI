from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv 
import os
import uvicorn
# Import necessary LangChain components for Gemini
from langchain_google_genai import ChatGoogleGenerativeAI # NEW

# Load environment variables from .env file
load_dotenv() 

# *** Use the new GEMINI_API_KEY variable ***
GEMINI_KEY = os.getenv("GEMINI_API_KEY") 

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    key_status = "Gemini Key Loaded" if GEMINI_KEY else "Gemini Key Missing"
    # Test initialization (This requires the key to be set as an environment variable)
    try:
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=GEMINI_KEY)
        test_response = llm.invoke("Say hi.")
        llm_status = "LLM Test Successful"
    except Exception as e:
        llm_status = f"LLM Test Failed: {e}"

    return {"Status": "RAG Backend Running", "Key_Check": key_status, "LLM_Test": llm_status}

@app.post("/process-docs")
async def process_docs(files: list[UploadFile]):
    # Your RAG processing logic goes here, using ChatGoogleGenerativeAI
    return {"message": f"Received {len(files)} files for processing."}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)