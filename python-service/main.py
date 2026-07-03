"""
PtoM Python 转换服务
FastAPI 本地服务，提供 PDF → Markdown 转换能力
"""

import os
import sys
import traceback
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from converter import convert_pdf_to_markdown

app = FastAPI(
    title="PtoM Converter",
    description="PDF to Markdown conversion service",
    version="1.0.0",
)

# 允许 Electron 主进程的本地请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ConvertRequest(BaseModel):
    pdf_path: str


class ConvertResponse(BaseModel):
    markdown: str
    images: dict[str, str] = {}
    pages: int = 0


@app.get("/health")
async def health():
    """健康检查端点"""
    return {"status": "ok", "service": "PtoM Converter"}


@app.post("/convert", response_model=ConvertResponse)
async def convert_pdf(request: ConvertRequest):
    """
    将 PDF 文件转换为 Markdown

    Args:
        request: 包含 pdf_path 字段的请求体

    Returns:
        ConvertResponse: 包含 markdown 内容和图片映射
    """
    pdf_path = request.pdf_path

    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail=f"文件不存在: {pdf_path}")

    if not pdf_path.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="仅支持 PDF 文件")

    try:
        result = convert_pdf_to_markdown(pdf_path)
        return ConvertResponse(
            markdown=result["markdown"],
            images=result.get("images", {}),
            pages=result.get("pages", 0),
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"转换失败: {str(e)}")


def main():
    import uvicorn
    port = int(os.environ.get("PTOM_PORT", "18720"))
    print(f"Starting PtoM Converter on port {port}")
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")


if __name__ == "__main__":
    main()
