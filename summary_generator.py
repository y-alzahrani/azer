import json
import os
import anthropic

client = anthropic.Anthropic()


def get_company_narratives(company, docs):
    """Extracts narrative sections from raw JSON files for a specific company, tagged by period."""
    narratives = {}
    for doc in docs:
        if doc["company"] == company:
            narratives[doc["period"]] = doc["narrative"]["sections_found"]
    return narratives


def generate_summary(company, financials, docs):
    """Generates an Arabic analysis summary for a company using all available periods."""

    company_financials = financials[company]
    company_narratives = get_company_narratives(company, docs)

    prompt = f"""أنت محلل مالي متخصص. سيتم تزويدك ببيانات مالية شاملة لشركة {company} تغطي جميع الفترات المتاحة، تشمل المقاييس المالية المستخرجة والنسب المحسوبة وملخصات التقارير المالية.

مهمتك هي كتابة تحليل باللغة العربية يتضمن ثلاثة أقسام:

**الإيجابيات**
- اذكر ابرز 3-5 نقاط إيجابية مستخرجة من البيانات المالية وملخصات التقارير
- كل نقطة جملة واحدة مختصرة تتضمن أرقاماً ونسباً محددة
- ركز على الاتجاهات الإيجابية عبر السنوات وليس فقط آخر فترة

**السلبيات**
- اذكر ابرز 3-5 نقاط سلبية أو مخاطر مستخرجة من البيانات المالية وملخصات التقارير
- كل نقطة جملة واحدة مختصرة تتضمن أرقاماً ونسباً محددة
- ركز على الاتجاهات السلبية عبر السنوات وليس فقط آخر فترة

**النظرة العامة**
- اكتب 3 فقرات شمولية تربط الأرقام بقرارات الإدارة وتوجهاتها المستقبلية
- الفقرة الأولى: المسار المالي للشركة عبر الفترات المتاحة (مثل الإيرادات، الربحية، الهوامش، والتدفقات النقدية)
- الفقرة الثانية: القرارات الاستراتيجية الرئيسية وأثرها المالي (مثل النفقات الرأسمالية والديون)
- الفقرة الثالثة: توجهات الإدارة والتوقعات المستقبلية المستندة حصراً إلى ما صرّحت به الإدارة في التقارير

قواعد صارمة:
- اكتب باللغة العربية حصراً
- استند فقط إلى البيانات المقدمة، لا تخترع معلومات أو تتوقع أرقاماً مستقبلية من عندك
- كن محدداً — أذكر الأرقام الفعلية والنسب المئوية والتغيرات السنوية
- لا تُعبّر عن رأيك في السهم ولا توصي بالشراء أو البيع
- في قسم النظرة العامة، استند إلى توجهات الإدارة من ملخصات التقارير فقط
- اعرض الأرقام بالوحدة الأنسب للقارئ (مليار أو تريليون) وليس بالملايين أو الألوف دائماً. مثال: 1,346,930 مليون ريال = 1.35 تريليون ريال. مثال آخر: 3,475 مليون ريال = 3.48 مليار ريال
- استخدم المصطلحات العربية الصحيحة والشائعة في التقارير المالية، ولا تُعرِّب الكلمات الأجنبية بالنقحرة (transliteration)
- عند ذكر مصطلحات أو اختصارات باللغة الإنجليزية داخل النص العربي، ضع مسافة بين حرف الواو والمصطلح الإنجليزي. مثال: "AOPC و AGPC" وليس "AOPC وAGPC"
- استخدم المصطلحات المالية العربية الصحيحة: Upstream = قطاع المنبع، Downstream = قطاع المصب
- عند الإشارة إلى الفترات الزمنية اكتب "الربع الأول من عام 2026" وليس "الربع الأول 2026"

أعد الإجابة بصيغة JSON فقط بالشكل التالي، بدون أي نص إضافي قبل أو بعد JSON:

{{
  "الإيجابيات": ["نقطة 1", "نقطة 2", ...],
  "السلبيات": ["نقطة 1", "نقطة 2", ...],
  "النظرة العامة": "الفقرات هنا..."
}}

البيانات المالية:
{json.dumps(company_financials, ensure_ascii=False, indent=2)}

ملخصات التقارير المالية:
{json.dumps(company_narratives, ensure_ascii=False, indent=2)}"""

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=10000,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    result_text = response.content[0].text
    clean_text = result_text.strip().replace("```json", "").replace("```", "").strip()
    last_brace = clean_text.rfind("}")
    if last_brace != -1:
        if last_brace < len(clean_text) - 1:
            print("Warning: extra text detected after closing brace - truncating")
        clean_text = clean_text[:last_brace + 1]

    return json.loads(clean_text)


def save_summary(company, summary, base_folder="summaries"):
    """Saves the generated summary to disk as a cache."""
    os.makedirs(base_folder, exist_ok=True)
    summary_path = os.path.join(base_folder, f"{company}_summary.json")
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump({"summary": summary}, f, ensure_ascii=False, indent=2)
    print(f"Summary saved for {company}")


def load_summary(company, base_folder="summaries"):
    """Loads cached summary from disk. Returns None if not found."""
    summary_path = os.path.join(base_folder, f"{company}_summary.json")
    if os.path.exists(summary_path):
        print(f"Loaded cached summary for {company}")
        with open(summary_path, encoding="utf-8") as f:
            return json.load(f)["summary"]
    return None