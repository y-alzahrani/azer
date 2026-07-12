export default function Glossary() {

  const metrics = [
    {
      name: 'الإيرادات',
      nameEn: 'Revenue',
      definition: 'إجمالي المبالغ التي حققتها الشركة من بيع منتجاتها أو خدماتها خلال الفترة.',
      high: 'الشركة تنمو وتوسع أعمالها',
      low: 'قد يدل على ضعف الطلب أو فقدان حصة سوقية',
    },
    {
      name: 'الربح التشغيلي',
      nameEn: 'Operating Income',
      definition: 'الربح الذي حققته الشركة من نشاطها التجاري الأساسي قبل الفوائد والضرائب.',
      high: 'النشاط الأساسي للشركة مربح',
      low: 'النشاط الأساسي للشركة لا يحقق مكاسب كافية',
    },
    {
      name: 'صافي الربح',
      nameEn: 'Net Income',
      definition: 'ما تحتفظ به الشركة من إيراداتها بعد خصم جميع التكاليف والضرائب.',
      high: 'الشركة مربحة وتخلق قيمة للمساهمين',
      low: 'الشركة لا تحقق مكاسب كافية',
    },
    {
      name: 'هامش الربح التشغيلي',
      nameEn: 'Operating Margin',
      definition: 'نسبة الربح التشغيلي إلى الإيرادات — يقيس كفاءة الشركة في إدارة نفقاتها.',
      high: 'الشركة تدير نفقاتها بكفاءة عالية',
      low: 'قد يدل على ارتفاع في النفقات أو ضعف القدرة التنافسية',
    },
    {
      name: 'هامش الربح الصافي',
      nameEn: 'Net Margin',
      definition: 'نسبة صافي الربح إلى الإيرادات — يقيس نسبة الربح المتبقي من الإيرادات بعد خصم جميع التكاليف والضرائب.',
      high: 'الشركة تحول نسبة كبيرة من إيراداتها إلى أرباح',
      low: 'قد يدل على تكاليف مرتفعة أو ضغوط تنافسية',
    },
    {
      name: 'التدفق النقدي الحر',
      nameEn: 'Free Cash Flow',
      definition: 'النقد المتبقي بعد تغطية تكاليف التشغيل والنفقات الرأسمالية — يمثل النقد الفعلي الذي تولده الشركة.',
      high: 'الشركة تولّد نقدًا كافيًا لتمويل نموها وإعادته للمساهمين',
      low: 'الشركة تنفق نقدًا كثيرًا ولا يتبقى لها الكثير لتوزيع الأرباح أو سداد الديون أو التوسع',
    },
    {
      name: 'النقد وما يعادله',
      nameEn: 'Cash & Cash Equivalents',
      definition: 'إجمالي النقد والأصول التي يمكن تحويلها إلى سيولة نقدية بشكل فوري.',
      high: 'الشركة تملك نقدًا كافيًا يمنحها حماية ضد الأزمات المفاجئة ومرونة لاقتناص الفرص الاستثمارية',
      low: 'يشير إلى نقص في السيولة',
    },
    {
      name: 'إجمالي الديون',
      nameEn: 'Total Debt',
      definition: 'مجموع القروض والسندات والتمويلات الأخرى التي تلتزم الشركة بسدادها.',
      high: 'قد يشكل عبئًا ماليًا في حال تراجع الأرباح',
      low: 'مخاطر مالية أقل واستقرارًا أكبر خلال الأزمات',
      positive: true,
      negative: true
    },
    {
      name: 'صافي الدين',
      nameEn: 'Net Debt',
      definition: 'إجمالي الديون مطروحًا منه النقد وما يعادله.',
      high: 'ديون الشركة تتجاوز ما تملكه من نقد',
      low: 'الشركة تملك نقدًا أكثر من ديونها',
      positive: true,
      negative: true
    },
    {
      name: 'نسبة الدين إلى حقوق الملكية',
      nameEn: 'Debt / Equity Ratio',
      definition: 'إجمالي الديون مقسومًا على حقوق الملكية — يقيس مدى اعتماد الشركة على الدين لتمويل أعمالها.',
      high: 'الشركة تعتمد بشكل كبير على الدين في تمويل أعمالها',
      low: 'الشركة تعتمد بشكل أساسي على أموال مساهميها',
      positive: true,
      negative: true
    },
    {
      name: 'الأسهم القائمة',
      nameEn: 'Shares Outstanding',
      definition: 'إجمالي عدد أسهم الشركة التي يملكها جميع المساهمين حاليًا.',
      noHighLow: true
    },
    {
      name: 'القيمة السوقية',
      nameEn: 'Market Capitalization',
      definition: 'سعر السهم مضروبًا في عدد الأسهم القائمة — يُظهر القيمة الإجمالية للشركة في السوق.',
      high: 'الشركة مستقرة ويثق فيها المستثمرون',
      low: 'الشركة أكثر عرضة للتقلبات ولكن قد تكون أكثر قدرة على النمو',
    },
    {
      name: 'ربحية السهم',
      nameEn: 'Earnings Per Share',
      definition: 'صافي ربح الشركة مقسومًا على عدد الأسهم القائمة — يُظهر حصة كل سهم من أرباح الشركة.',
      high: 'الشركة تولد أرباحًا عالية لكل مساهم',
      low: 'الشركة لا تولد أرباحًا كافية للمساهمين',
    },
    {
      name: 'مكرر الأرباح الحالي',
      nameEn: 'P/E Ratio',
      definition: 'سعر السهم مقسومًا على ربحية السهم — يُظهر كم يدفع المستثمر مقابل كل ريال من أرباح الشركة.',
      high: 'السهم مبالغ في تقييمه أو يتوقع المستثمرون نموًا في الأرباح',
      low: 'السهم رخيص مقارنة بالأرباح أو يتوقع المستثمرون تراجعًا في الأرباح',
      neutral: true
    },
    {
      name: 'مكرر الأرباح المستقبلي',
      nameEn: 'Forward P/E Ratio',
      definition: 'سعر السهم مقسومًا على الأرباح المتوقعة للسهم خلال الـ 12 شهرًا القادمة — يعكس توقعات المستثمرين للأرباح المستقبلية.',
      high: 'الأرباح المتوقعة أقل من الحالية',
      low: 'الأرباح المتوقعة أعلى من الحالية',
      highLabel: 'أعلى من مكرر الأرباح الحالي',
      lowLabel: 'أقل من مكرر الأرباح الحالي',
      positive: 'var(--positive)',
      negative: 'var(--negative)'
    },
    {
      name: 'مكرر المبيعات',
      nameEn: 'P/S Ratio',
      definition: 'القيمة السوقية مقسومة على الإيرادات — يُستخدم لتقييم الشركات التي لا تحقق أرباحًا بعد.',
      high: 'السهم غالي نسبةً لإيرادات الشركة — قد يكون مبالغًا في تقييمه أو أن المستثمرين يتوقعون نموًا للأرباح في المستقبل',
      low: 'قد يعني فرصة للشراء أو يعكس شكوكًا حول قدرة الشركة على تحقيق الأرباح',
      neutral: true
    },
    {
      name: 'مكرر القيمة الدفترية',
      nameEn: 'P/B Ratio',
      definition: 'القيمة السوقية للشركة مقسومة على صافي أصولها — يُظهر كم يدفع المستثمرون مقارنةً بما تمتلكه الشركة فعليًا من أصول في دفاترها.',
      high: 'قد يعني مبالغة في تقييم السهم أو أن المستثمرين يتوقعون نموًا للشركة',
      low: 'قد يعني أن السهم رخيص نسبةً لأصول الشركة أو أن الشركة تواجه تحديات',
      lowLabel: 'أقل من 1',
      neutral: true
    },
    {
      name: 'متوسط تكلفة رأس المال',
      nameEn: 'WACC',
      definition: 'المعدل الذي تدفعه الشركة في المتوسط لجميع مموليها (المستثمرين والدائنين) لتمويل أعمالها.',
      high: 'تكلفة تمويل مرتفعة تؤدي إلى انخفاض في القيمة الجوهرية المقدّرة للشركة',
      low: 'تكلفة تمويل منخفضة ترتفع معها القيمة الجوهرية المقدّرة للشركة',
      positive: 'var(--positive)',
      negative: 'var(--negative)'
    },
    {
      name: 'معدل النمو النهائي',
      nameEn: 'Terminal Growth Rate',
      definition: 'معدل النمو المتوقع للتدفقات النقدية على المدى البعيد — لا يمكن أن يتجاوز معدل نمو الاقتصاد.',
      high: 'افتراض متفائل يرفع القيمة الجوهرية',
      low: 'افتراض متحفظ يخفض القيمة الجوهرية',
    },
  ]

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '2rem',
      direction: 'rtl',
      fontFamily: 'var(--font)',
    }}>

      {/* Header */}
      <div style={{ marginBottom: '1.3rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-1)', marginBottom: '2rem' }}>
          المصطلحات المالية
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-2)' }}>
          شرح مبسط للمقاييس والمؤشرات المالية المستخدمة في المنصة
        </p>
      </div>

      {/* Metrics list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {metrics.map((metric, i) => (
          <div key={i} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '1.25rem',
            transition: 'border-color 0.2s',
          }}
          >
            {/* Metric name */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-1)' }}>
                {metric.name}
              </span>
              <span style={{ fontSize: '14px', color: 'var(--accent)' }}>
                {metric.nameEn}
              </span>
            </div>

            {/* Definition */}
            <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.7, marginBottom: '12px' }}>
              {metric.definition}
            </p>

            {/* High / Low */}
            {!metric.noHighLow && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{
                flex: 1,
                background: metric.neutral ? 'rgba(160, 160, 160, 0.05)' : metric.negative ? 'rgba(248,113,113,0.08)' : 'rgba(74,222,128,0.08)',
                border: `1px solid ${metric.neutral ? 'rgba(160,160,160,0.2)' : metric.negative ? 'rgba(248,113,113,0.2)' : 'rgba(74,222,128,0.2)'}`,
                borderRadius: 'var(--radius)',
                padding: '8px 12px',
              }}>
                <span style={{ fontSize: '13px', color: metric.neutral ? 'var(--text-1)' : metric.negative ? 'var(--negative)' : 'var(--positive)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  {metric.highLabel || 'مرتفع'}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>
                  {metric.high}
                </span>
              </div>
              <div style={{
                flex: 1,
                background: metric.neutral ? 'rgba(160, 160, 160, 0.05)' : metric.positive ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
                border: `1px solid ${metric.neutral ? 'rgba(160,160,160,0.2)' : metric.positive ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`,
                borderRadius: 'var(--radius)',
                padding: '8px 12px',
              }}>
                <span style={{ fontSize: '13px', color: metric.neutral ? 'var(--text-1)' : metric.positive ? 'var(--positive)' : 'var(--negative)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  {metric.lowLabel || 'منخفض'}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>
                  {metric.low}
                </span>
              </div>
            </div>
            )}

          </div>
        ))}
      </div>

    </div>
  )
}
