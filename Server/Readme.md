# 📘 Note AI
A Document-Based Question Answering (RAG) System built with **FastAPI**, **LangChain**, and a modern **React** frontend.

Note AI allows you to upload multiple documents, extract knowledge, and ask natural language questions.  
The backend retrieves relevant chunks using vector search and generates accurate answers using LLMs.

---

## 🚀 Features

### 🔹 Frontend (React + Vite)
- Clean UI for uploading PDF, DOCX, or TXT files
- Real-time chat-style Q&A interface
- Shows chat history and model responses
- Loading indicators & error handling
- Smooth icons using React Icons
- Environment-based API configuration

### 🔹 Backend (FastAPI + LangChain)
- File upload endpoint with document parsing
- PDF & DOCX text extraction
- Embedding generation
- Vector store indexing (FAISS or Chroma)
- RAG pipeline with retrieval + generation
- Chat history support for contextual queries
- Custom model selection (Mistral, Llama, Qwen, etc.)

---

## 📂 Project Structure

Note AI/
│
├── 📁 Client/
│   ├── 📂 public/
│   ├── 📂 src/
│   │   ├── 🖼️ assets/
│   │   │   └── 📸 screenshots/
│   │   ├── 🧩 components/
│   │   │   ├── 📄 FileUpload.jsx
│   │   │   ├── 📄 QnA.jsx
│   │   │   └── 📄 ChatHistoryDisplay.jsx
│   │   ├── ⚛️ App.jsx
│   │   ├── 🎨 App.css
│   │   ├── ⚛️ main.jsx
│   │   ├── 🎨 index.css
│   │   └── 🎨 QnA.css
│   ├── ⚙️ vite.config.js
│   ├── 🧾 package.json
│   └── 🌐 index.html
│
├── 🖥️ Server/
│   ├── 🐍 main.py
│   ├── 🧠 rag_pipeline.py
│   ├── 📦 models/
│   ├── 📂 uploads/
│   ├── 🧠 vectorstore/
│   ├── 🧾 requirements.txt
│   └── 🔒 .env
│
└── 🚫 .gitignore




---

## 🛠️ Installation & Setup

### 1. Clone the repository

git clone https://github.com/your-username/note-ai.git
cd note-ai

🧠 Backend Setup (FastAPI)
2. Create virtual environment
cd backend
python -m venv venv
source venv/bin/activate   # Mac/Linux
venv\Scripts\activate      # Windows

3. Install dependencies
pip install -r requirements.txt

4. Run the FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000


Backend runs at:
👉 http://localhost:8000

💻 Frontend Setup (React + Vite)
5. Install dependencies
cd ../frontend
npm install

6. Create environment file
VITE_RENDER_API_URL=http://localhost:8000

7. Run app
npm run dev


Frontend runs at:
👉 http://localhost:5173

🧪 Usage Workflow

Start backend

Start frontend

Upload a PDF, DOCX, or TXT file

System extracts text + stores embeddings

Ask questions in the chatbox

System retrieves relevant text and generates an answer

Sources are displayed under the answer

🤖 Supported LLM Models

UseD Hugging Face model for text-generation:

sentence-transformers/all-MiniLM-L6-v2
HuggingFaceH4/zephyr-7b-beta

![Screenshot](Client/src/assets/screenshots/SS1.png)
![Screenshot](Client/src/assets/screenshots/SS2.png)
![Screenshot](Client/src/assets/screenshots/SS3.png)