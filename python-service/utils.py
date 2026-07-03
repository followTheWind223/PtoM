"""
工具函数
"""

import os
import re
from pathlib import Path


def sanitize_filename(filename: str) -> str:
    """
    清理文件名，移除非法字符
    """
    # 移除 Windows 文件名中的非法字符
    illegal_chars = r'[<>:"/\\|?*]'
    sanitized = re.sub(illegal_chars, '_', filename)
    # 移除首尾空格和点
    sanitized = sanitized.strip('. ')
    if not sanitized:
        sanitized = 'untitled'
    return sanitized


def ensure_output_dir(output_dir: str) -> str:
    """
    确保输出目录存在
    """
    path = Path(output_dir)
    path.mkdir(parents=True, exist_ok=True)
    return str(path.absolute())


def get_output_path(pdf_path: str, output_dir: str | None = None) -> str:
    """
    根据 PDF 路径生成对应的 Markdown 输出路径

    Args:
        pdf_path: PDF 文件路径
        output_dir: 输出目录（默认与 PDF 同目录）

    Returns:
        Markdown 文件路径
    """
    pdf_name = Path(pdf_path).stem
    md_name = sanitize_filename(pdf_name) + '.md'

    if output_dir:
        return os.path.join(output_dir, md_name)
    else:
        return os.path.join(Path(pdf_path).parent, md_name)


def extract_images_dir(md_path: str) -> str:
    """
    获取 Markdown 文件对应的图片目录路径
    """
    base = Path(md_path).parent
    name = Path(md_path).stem
    images_dir = base / f"{name}_images"
    return str(images_dir)
