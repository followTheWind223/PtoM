"""
PDF → Markdown 转换模块

引擎优先级：
1. marker-pdf   — 质量最好（表格/公式/版面），但体积大、依赖深度学习模型
2. pymupdf4llm  — 轻量、速度快，保留标题/表格/图片，推荐默认引擎
3. PyMuPDF      — 纯文本提取回退
4. pdfplumber   — 最终回退
"""

import base64
from pathlib import Path


def convert_pdf_to_markdown(pdf_path: str) -> dict:
    """
    将 PDF 文件转换为 Markdown

    Returns:
        dict: {
            "markdown": str,        # Markdown 文本
            "images": dict,         # 图片映射 {filename: base64_data}
            "pages": int            # 页数
        }
    """
    engines = (
        _convert_with_marker,
        _convert_with_pymupdf4llm,
        _convert_with_pymupdf,
        _convert_with_pdfplumber,
    )
    last_error = None
    for engine in engines:
        try:
            return engine(pdf_path)
        except ImportError:
            continue
        except Exception as e:  # 引擎自身解析失败也尝试下一个
            print(f"[Converter] {engine.__name__} failed: {e}")
            last_error = e
            continue

    raise RuntimeError(
        f"没有可用的 PDF 转换引擎，请安装依赖: pip install pymupdf4llm PyMuPDF"
        + (f"（最后错误: {last_error}）" if last_error else "")
    )


def _convert_with_marker(pdf_path: str) -> dict:
    """使用 marker-pdf 引擎转换（质量最优）"""
    from marker.converters.pdf import PdfConverter
    from marker.models import create_model_dict

    converter = PdfConverter(artifact_dict=create_model_dict())
    rendered = converter(pdf_path)
    markdown = rendered.markdown

    images = {}
    if getattr(rendered, "images", None):
        for name, img_data in rendered.images.items():
            if isinstance(img_data, bytes):
                images[name] = base64.b64encode(img_data).decode("utf-8")
            elif hasattr(img_data, "save"):  # PIL Image
                import io

                buf = io.BytesIO()
                img_data.save(buf, format="PNG")
                images[name] = base64.b64encode(buf.getvalue()).decode("utf-8")

    return {
        "markdown": markdown,
        "images": images,
        "pages": len(getattr(rendered, "metadata", {}).get("page_stats", [])) or 0,
    }


def _convert_with_pymupdf4llm(pdf_path: str) -> dict:
    """使用 pymupdf4llm 转换：轻量且对标题/表格/图片支持好"""
    import tempfile

    import pymupdf  # noqa: F401  确保底层库可用
    import pymupdf4llm

    with tempfile.TemporaryDirectory() as tmpdir:
        markdown = pymupdf4llm.to_markdown(
            pdf_path,
            write_images=True,
            image_path=tmpdir,
        )

        # 收集导出的图片，把 markdown 中的绝对临时路径改写为文件名
        images = {}
        for img_file in Path(tmpdir).iterdir():
            if img_file.is_file():
                images[img_file.name] = base64.b64encode(img_file.read_bytes()).decode("utf-8")
                markdown = markdown.replace(str(img_file), img_file.name)
                # 兼容 Windows 路径分隔符差异
                markdown = markdown.replace(str(img_file).replace("\\", "/"), img_file.name)

    with pymupdf.open(pdf_path) as doc:
        pages = doc.page_count

    return {"markdown": markdown, "images": images, "pages": pages}


def _convert_with_pymupdf(pdf_path: str) -> dict:
    """使用 PyMuPDF 提取文本与图片（回退方案）"""
    import pymupdf

    markdown_parts = []
    images = {}

    with pymupdf.open(pdf_path) as doc:
        pages = doc.page_count
        for page_num, page in enumerate(doc, 1):
            text = page.get_text("text")
            if text.strip():
                markdown_parts.append(text)

            for img_index, img in enumerate(page.get_images(full=True)):
                xref = img[0]
                base_image = doc.extract_image(xref)
                name = f"page{page_num}_img{img_index}.{base_image['ext']}"
                images[name] = base64.b64encode(base_image["image"]).decode("utf-8")
                markdown_parts.append(f"![{name}]({name})")

    return {
        "markdown": "\n\n".join(markdown_parts),
        "images": images,
        "pages": pages,
    }


def _convert_with_pdfplumber(pdf_path: str) -> dict:
    """使用 pdfplumber 提取纯文本（最终回退）"""
    import pdfplumber

    with pdfplumber.open(pdf_path) as pdf:
        parts = [page.extract_text() or "" for page in pdf.pages]
        pages = len(pdf.pages)

    return {
        "markdown": "\n\n".join(p for p in parts if p),
        "images": {},
        "pages": pages,
    }
