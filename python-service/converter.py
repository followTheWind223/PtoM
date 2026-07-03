"""
PDF → Markdown 转换模块
基于 marker-pdf 引擎
"""

import os
import base64
from pathlib import Path
from typing import Optional


def convert_pdf_to_markdown(pdf_path: str) -> dict:
    """
    将 PDF 文件转换为 Markdown

    优先使用 marker-pdf 引擎，如果不可用则回退到 PyMuPDF

    Args:
        pdf_path: PDF 文件路径

    Returns:
        dict: {
            "markdown": str,        # Markdown 文本
            "images": dict,         # 图片映射 {filename: base64_data}
            "pages": int            # 页数
        }
    """
    # 尝试使用 marker-pdf
    try:
        return _convert_with_marker(pdf_path)
    except ImportError:
        print("[Converter] marker-pdf not available, falling back to PyMuPDF")
        try:
            return _convert_with_pymupdf(pdf_path)
        except ImportError:
            print("[Converter] PyMuPDF not available either, using basic text extraction")
            return _convert_basic(pdf_path)


def _convert_with_marker(pdf_path: str) -> dict:
    """
    使用 marker-pdf 引擎转换
    marker-pdf 是目前最好的 PDF→MD 工具之一
    """
    from marker.converters.pdf import PdfConverter
    from marker.models import create_model_dict

    converter = PdfConverter(
        artifact_dict=create_model_dict(),
    )

    rendered = converter(pdf_path)

    # rendered.markdown 是最终的 Markdown 输出
    markdown = rendered.markdown

    # 提取图片
    images = {}
    if hasattr(rendered, 'images') and rendered.images:
        for name, img_data in rendered.images.items():
            if isinstance(img_data, bytes):
                images[name] = base64.b64encode(img_data).decode('utf-8')

    return {
        "markdown": markdown,
        "images": images,
        "pages": getattr(rendered, 'pages', 0) or 0,
    }


def _convert_with_pymupdf(pdf_path: str) -> dict:
    """
    使用 PyMuPDF (fitz) 作为回退方案
    """
    import fitz  # PyMuPDF

    doc = fitz.open(pdf_path)
    markdown_parts = []
    images = {}

    for page_num, page in enumerate(doc, 1):
        # 尝试获取页面的 markdown（PyMuPDF 支持）
        try:
            md = page.get_text("markdown")
            if md:
                markdown_parts.append(md)
            else:
                markdown_parts.append(page.get_text("text"))
        except Exception:
            markdown_parts.append(page.get_text("text"))

        # 提取图片
        for img_index, img in enumerate(page.get_images(full=True)):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            ext = base_image["ext"]
            name = f"page{page_num}_img{img_index}.{ext}"
            images[name] = base64.b64encode(image_bytes).decode('utf-8')

    doc.close()

    return {
        "markdown": "\n\n".join(markdown_parts),
        "images": images,
        "pages": len(doc),
    }


def _convert_basic(pdf_path: str) -> dict:
    """
    最基础的回退方案：读取文本内容
    """
    # 尝试使用 pdfplumber
    try:
        import pdfplumber
        with pdfplumber.open(pdf_path) as pdf:
            parts = []
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    parts.append(text)
            return {
                "markdown": "\n\n".join(parts),
                "images": {},
                "pages": len(pdf.pages),
            }
    except ImportError:
        pass

    # 最终回退
    return {
        "markdown": f"[无法解析 PDF: {pdf_path}]\n\n请安装 marker-pdf 或 PyMuPDF:\n"
                    f"  pip install marker-pdf\n"
                    f"  pip install PyMuPDF",
        "images": {},
        "pages": 0,
    }
