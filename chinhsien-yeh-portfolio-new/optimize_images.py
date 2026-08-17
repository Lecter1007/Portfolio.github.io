#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量优化图片以减小文件大小
"""
from PIL import Image
import os
import sys
from pathlib import Path

# 修复 Windows 控制台编码问题
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def optimize_image(image_path, quality=85, max_width=2000):
    """
    优化单个图片
    - 转换为 RGB（去除透明通道如果不需要）
    - 调整过大的尺寸
    - 压缩质量
    """
    try:
        img = Image.open(image_path)
        original_size = os.path.getsize(image_path)

        # 如果图片宽度超过 max_width，按比例缩小
        if img.width > max_width:
            ratio = max_width / img.width
            new_size = (max_width, int(img.height * ratio))
            img = img.resize(new_size, Image.Resampling.LANCZOS)
            print(f"  调整尺寸: {img.width}x{img.height}")

        # 保存优化后的图片
        if image_path.suffix.lower() == '.png':
            # PNG: 转换为 RGB 并保存为 JPG（如果没有透明度）
            if img.mode in ('RGBA', 'LA'):
                # 检查是否真的有透明度
                if img.mode == 'RGBA':
                    alpha = img.split()[3]
                    if alpha.getextrema()[0] == 255:  # 没有真正的透明度
                        img = img.convert('RGB')
                        new_path = image_path.with_suffix('.jpg')
                        img.save(new_path, 'JPEG', quality=quality, optimize=True)
                        os.remove(image_path)
                        new_size = os.path.getsize(new_path)
                        print(f"✓ {image_path.name} -> {new_path.name}: {original_size//1024}KB -> {new_size//1024}KB (节省 {100*(1-new_size/original_size):.1f}%)")
                        return
                    else:
                        # 有透明度，保持 PNG 但优化
                        img.save(image_path, 'PNG', optimize=True)
                else:
                    img = img.convert('RGB')
                    new_path = image_path.with_suffix('.jpg')
                    img.save(new_path, 'JPEG', quality=quality, optimize=True)
                    os.remove(image_path)
                    new_size = os.path.getsize(new_path)
                    print(f"✓ {image_path.name} -> {new_path.name}: {original_size//1024}KB -> {new_size//1024}KB (节省 {100*(1-new_size/original_size):.1f}%)")
                    return
            else:
                # 非透明 PNG，转为 JPG
                img = img.convert('RGB')
                new_path = image_path.with_suffix('.jpg')
                img.save(new_path, 'JPEG', quality=quality, optimize=True)
                os.remove(image_path)
                new_size = os.path.getsize(new_path)
                print(f"✓ {image_path.name} -> {new_path.name}: {original_size//1024}KB -> {new_size//1024}KB (节省 {100*(1-new_size/original_size):.1f}%)")
                return

        elif image_path.suffix.lower() in ['.jpg', '.jpeg']:
            # JPG: 重新压缩
            img = img.convert('RGB')
            img.save(image_path, 'JPEG', quality=quality, optimize=True)

        new_size = os.path.getsize(image_path)
        if new_size < original_size:
            print(f"✓ {image_path.name}: {original_size//1024}KB -> {new_size//1024}KB (节省 {100*(1-new_size/original_size):.1f}%)")
        else:
            print(f"- {image_path.name}: 已经是最优大小")

    except Exception as e:
        print(f"✗ {image_path.name}: 错误 - {e}")

def main():
    # 当前目录
    root = Path('.')

    # 找出所有图片
    image_extensions = {'.png', '.jpg', '.jpeg'}
    images = [f for f in root.rglob('*') if f.suffix.lower() in image_extensions and f.is_file()]

    print(f"找到 {len(images)} 个图片文件\n")

    total_before = 0
    total_after = 0

    for img_path in images:
        size_before = os.path.getsize(img_path)
        total_before += size_before

        optimize_image(img_path)

        # 检查新文件（可能改了扩展名）
        jpg_path = img_path.with_suffix('.jpg')
        if jpg_path.exists():
            total_after += os.path.getsize(jpg_path)
        elif img_path.exists():
            total_after += os.path.getsize(img_path)

    print(f"\n总计: {total_before//1024//1024}MB -> {total_after//1024//1024}MB")
    print(f"节省: {100*(1-total_after/total_before):.1f}%")

if __name__ == '__main__':
    main()
