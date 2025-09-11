import pytesseract
from flask import Flask, request, jsonify
from PIL import Image
import numpy as np
import re  # لاستخراج الأرقام من النصوص
import json  # إضافة استيراد مكتبة json

# تحديد المسار إلى tesseract في حال كان على نظام Windows أو أي مسار مخصص
# على نظام Linux أو macOS لا حاجة لتحديد المسار إذا تم تثبيته عبر الحزمة المعتادة.

app = Flask(__name__)

@app.route('/ocr', methods=['POST'])
def ocr():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image provided"}), 400

        file = request.files['image']
        if file and file.filename.endswith(('png', 'jpg', 'jpeg', 'gif')):
            # فتح الصورة باستخدام PIL
            img = Image.open(file.stream)
            
            # تحويل الصورة إلى numpy array
            img_np = np.array(img)
            
            # استخدام pytesseract لاستخراج النص
            result = pytesseract.image_to_string(img, lang='ara')

            # حفظ النص المستخرج في ملف نصي
            with open("ocr_text_result.txt", "w", encoding="utf-8") as text_file:
                text_file.write(result)

            # استخراج العناصر من النص
            menu_items = []
            for line in result.split("\n"):
                text = line.strip()
                if not text:
                    continue  # تجاهل الأسطر الفارغة
                
                # محاولة استخراج السعر من النص باستخدام تعبيرات منتظمة
                price_match = re.search(r'(\d{1,3}(,\d{3})*(\.\d{1,2})?|\d+(\.\d{1,2})?)\s?(ج\.م|SAR|USD|€|¥)?', text)
                
                # إذا تم العثور على السعر، قم بفصل الاسم والسعر
                if price_match:
                    price = price_match.group(0)  # استخراج السعر بالكامل من النص
                    item_name = text.replace(price, "").strip()  # إزالة السعر من النص للاحتفاظ بالاسم فقط
                else:
                    price = "N/A"  # القيمة الافتراضية إذا لم يتم العثور على سعر
                    item_name = text  # إذا لم يوجد سعر، يُعتبر النص كله هو اسم العنصر
                
                # إضافة العنصر مع الاسم والسعر المستخرجين
                menu_items.append({"item": item_name, "price": price})

            # حفظ البيانات في ملف JSON للاختبار
            file_path = 'menu_items.json'
            with open(file_path, 'w', encoding='utf-8') as json_file:
                json.dump({"menu_items": menu_items}, json_file, ensure_ascii=False, indent=4)

            # إرجاع رسالة تؤكد الحفظ
            return jsonify({"message": f"Menu items saved to {file_path}", "menu_items": menu_items}), 200

        else:
            return jsonify({"error": "Invalid file type. Only PNG, JPG, JPEG, and GIF are allowed."}), 400

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
