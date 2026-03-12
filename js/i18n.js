const translations = {
    en: {
        app_title: "CyberScan AI",
        upload_documents: "Upload Documents",
        upload_cv_title: "Candidate CV/Resume",
        upload_jd_title: "Job Description",
        upload_desc: "Drag & drop or click to upload PDF/DOCX",
        analyze_btn: "Analyze Candidate",
        waiting_analysis: "Awaiting Documents for Analysis",
        waiting_desc: "Upload a CV and JD to generate comprehensive AI insights.",
        analyzing: "Scanning document structure and evaluating fit...",

        report_summary: "Executive Summary",
        pros: "Key Strengths & Competencies",
        cons: "Gaps & Areas for Growth",
        detailed_eval: "Detailed Evaluation",
        conclusion: "Conclusion",

        verdict_strong: "Good to Hire (Strong Match)",
        verdict_solid: "Good to Hire (Solid Match)",
        verdict_borderline: "Not to Hire (Borderline)",
        verdict_pass: "Not to Hire (Pass)"
    }
};

class I18nManager {
    constructor() {
        this.currentLang = 'en';
        this.cacheNodes();
    }

    cacheNodes() {
        this.nodes = document.querySelectorAll('[data-i18n]');
    }

    setLanguage(lang) {
        if (!translations[lang]) return;
        this.currentLang = lang;
        this.updateDOM();
    }

    updateDOM() {
        this.nodes.forEach(node => {
            const key = node.getAttribute('data-i18n');
            if (translations[this.currentLang][key]) {
                if (node.tagName.toLowerCase() === 'option') {
                    node.text = translations[this.currentLang][key].replace(/\r?\n|\r/g, '');
                } else {
                    node.textContent = translations[this.currentLang][key].replace(/\r?\n|\r/g, '');
                }
            }
        });
    }

    getText(key) {
        return translations[this.currentLang][key] || key;
    }
}

const i18n = new I18nManager();
