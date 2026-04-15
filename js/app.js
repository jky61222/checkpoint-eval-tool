// No static imports here. We use dynamic imports to support file:// protocol Execution

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const cvUpload = document.getElementById('cv-upload');
    const jdUpload = document.getElementById('jd-upload');
    const cvDropzone = document.getElementById('cv-dropzone');
    const jdDropzone = document.getElementById('jd-dropzone');
    const cvStatus = document.getElementById('cv-status');
    const jdStatus = document.getElementById('jd-status');
    const analyzeBtn = document.getElementById('analyze-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');

    const resultsIdle = document.getElementById('results-idle');
    const resultsLoading = document.getElementById('results-loading');
    const resultsDashboard = document.getElementById('results-dashboard');

    // State
    let cvFile = null;
    let jdFile = null;

    let sentimentClassifier = null;

    async function analyzeTextSentiment(text, onStatusChange = null) {
        if (!text) return null;

        try {
            // Load the model if it hasn't been loaded yet
            if (!sentimentClassifier) {
                if (onStatusChange) {
                    onStatusChange("Loading Sentiment AI model (~60MB download)...");
                }
                
                // Dynamically import from CDN to avoid CORS 'module' execution blocks on local file:// opens
                const transformers = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers');
                transformers.env.allowLocalModels = false;
                transformers.env.useBrowserCache = true;
                
                // Using the specific, fast model requested by the user
                sentimentClassifier = await transformers.pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
            }

            if (onStatusChange) {
                onStatusChange("Analyzing CV Tone/Sentiment...");
            }
            
            // Run the model
            const result = await sentimentClassifier(text);

            return {
                label: result[0].label,
                score: (result[0].score * 100).toFixed(1)
            };

        } catch (error) {
            console.error("Transformers.js Error:", error);
            return null;
        }
    }

    // Dropzone setup helper
    function setupDropzone(dropzone, input, statusEl, isCV) {
        dropzone.addEventListener('click', () => input.click());

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');

            if (e.dataTransfer.files.length) {
                handleFile(e.dataTransfer.files[0], dropzone, statusEl, isCV);
            }
        });

        input.addEventListener('change', (e) => {
            if (e.target.files.length) {
                handleFile(e.target.files[0], dropzone, statusEl, isCV);
            }
        });
    }

    function handleFile(file, dropzone, statusEl, isCV) {
        const ext = file.name.split('.').pop().toLowerCase();
        if (ext !== 'pdf' && ext !== 'docx') {
            statusEl.textContent = "Error: Only PDF or DOCX allowed";
            statusEl.style.color = "var(--accent-red)";
            dropzone.classList.remove('success');
            if (isCV) cvFile = null;
            else jdFile = null;
            checkReadyState();
            return;
        }

        statusEl.textContent = file.name;
        statusEl.style.color = "var(--accent-green)";
        dropzone.classList.add('success');

        if (isCV) cvFile = file;
        else jdFile = file;

        checkReadyState();
    }

    // Setup D&D
    setupDropzone(cvDropzone, cvUpload, cvStatus, true);
    setupDropzone(jdDropzone, jdUpload, jdStatus, false);

    function checkReadyState() {
        if (cvFile && jdFile) {
            analyzeBtn.removeAttribute('disabled');
            analyzeBtn.classList.add('pulse-animation');
        } else {
            analyzeBtn.setAttribute('disabled', 'true');
            analyzeBtn.classList.remove('pulse-animation');
        }
    }

    // Analysis Execution
    analyzeBtn.addEventListener('click', async () => {
        // UI State -> Loading
        resultsIdle.classList.add('hidden');
        resultsDashboard.classList.add('hidden');
        resultsLoading.classList.remove('hidden');

        // Reset sentiment loading state
        const sentimentLabel = document.getElementById('sentiment-label');
        const sentimentScoreText = document.getElementById('sentiment-score-text');
        const sentimentIcon = document.getElementById('sentiment-icon');
        
// No static imports here. We use dynamic imports to support file:// protocol Execution

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const cvUpload = document.getElementById('cv-upload');
    const jdUpload = document.getElementById('jd-upload');
    const cvDropzone = document.getElementById('cv-dropzone');
    const jdDropzone = document.getElementById('jd-dropzone');
    const cvStatus = document.getElementById('cv-status');
    const jdStatus = document.getElementById('jd-status');
    const analyzeBtn = document.getElementById('analyze-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');

    const resultsIdle = document.getElementById('results-idle');
    const resultsLoading = document.getElementById('results-loading');
    const resultsDashboard = document.getElementById('results-dashboard');

    // State
    let cvFile = null;
    let jdFile = null;

    let sentimentClassifier = null;

    async function analyzeTextSentiment(text, onStatusChange = null) {
        if (!text) return null;

        try {
            // Load the model if it hasn't been loaded yet
            if (!sentimentClassifier) {
                if (onStatusChange) {
                    onStatusChange("Loading Sentiment AI model (~60MB download)...");
                }
                
                // Dynamically import from CDN to avoid CORS 'module' execution blocks on local file:// opens
                const transformers = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers');
                transformers.env.allowLocalModels = false;
                transformers.env.useBrowserCache = true;
                
                // Using the specific, fast model requested by the user
                sentimentClassifier = await transformers.pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
            }

            if (onStatusChange) {
                onStatusChange("Analyzing CV Tone/Sentiment...");
            }
            
            // Run the model
            const result = await sentimentClassifier(text);

            return {
                label: result[0].label,
                score: (result[0].score * 100).toFixed(1)
            };

        } catch (error) {
            console.error("Transformers.js Error:", error);
            return null;
        }
    }

    // Dropzone setup helper
    function setupDropzone(dropzone, input, statusEl, isCV) {
        dropzone.addEventListener('click', () => input.click());

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');

            if (e.dataTransfer.files.length) {
                handleFile(e.dataTransfer.files[0], dropzone, statusEl, isCV);
            }
        });

        input.addEventListener('change', (e) => {
            if (e.target.files.length) {
                handleFile(e.target.files[0], dropzone, statusEl, isCV);
            }
        });
    }

    function handleFile(file, dropzone, statusEl, isCV) {
        const ext = file.name.split('.').pop().toLowerCase();
        if (ext !== 'pdf' && ext !== 'docx') {
            statusEl.textContent = "Error: Only PDF or DOCX allowed";
            statusEl.style.color = "var(--accent-red)";
            dropzone.classList.remove('success');
            if (isCV) cvFile = null;
            else jdFile = null;
            checkReadyState();
            return;
        }

        statusEl.textContent = file.name;
        statusEl.style.color = "var(--accent-green)";
        dropzone.classList.add('success');

        if (isCV) cvFile = file;
        else jdFile = file;

        checkReadyState();
    }

    // Setup D&D
    setupDropzone(cvDropzone, cvUpload, cvStatus, true);
    setupDropzone(jdDropzone, jdUpload, jdStatus, false);

    function checkReadyState() {
        if (cvFile && jdFile) {
            analyzeBtn.removeAttribute('disabled');
            analyzeBtn.classList.add('pulse-animation');
        } else {
            analyzeBtn.setAttribute('disabled', 'true');
            analyzeBtn.classList.remove('pulse-animation');
        }
    }

    // Analysis Execution
    analyzeBtn.addEventListener('click', async () => {
        // UI State -> Loading
        resultsIdle.classList.add('hidden');
        resultsDashboard.classList.add('hidden');
        resultsLoading.classList.remove('hidden');

        // Reset sentiment loading state
        const sentimentLabel = document.getElementById('sentiment-label');
        const sentimentScoreText = document.getElementById('sentiment-score-text');
        const sentimentIcon = document.getElementById('sentiment-icon');
        
        sentimentLabel.textContent = "Analyzing...";
        sentimentLabel.style.color = "var(--text-color)";
        sentimentScoreText.textContent = "Loading AI Model...";
        sentimentIcon.className = "ph ph-spinner ph-spin";
        sentimentIcon.style.color = "var(--accent-blue)";

        try {
            // Parse documents (frontend parsing)
            const cvText = await DocumentParser.parseFile(cvFile);
            
            console.log("====================================");
            console.log("      RAW EXTRACTED CV TEXT         ");
            console.log("====================================");
            console.log(cvText);
            console.log("====================================");

            const jdText = jdFile ? await DocumentParser.parseFile(jdFile) : "";

            // Execute AI Mock call and Sentiment Analysis in parallel
            const [analysis, sentimentResult] = await Promise.all([
                AIService.analyze(cvText, jdText, (statusMsg) => {
                    document.querySelector('#results-loading p').textContent = statusMsg;
                }),
                analyzeTextSentiment(cvText, (statusMsg) => {
                    sentimentScoreText.textContent = statusMsg;
                })
            ]);

            // Populate Dashboard
            renderResults(analysis);
            
            // Populate Sentiment Result
            if (sentimentResult) {
                sentimentLabel.textContent = sentimentResult.label;
                sentimentScoreText.textContent = `${sentimentResult.score}% Confidence Score`;
                
                // --- Generate Dynamic AI Insights ---
                const insightsEl = document.getElementById('sentiment-insights-text');
                if (insightsEl) {
                    const lowerText = cvText.toLowerCase();
                    let foundKeywords = [];
                    let insightText = "";

                    if (sentimentResult.label === 'POSITIVE') {
                        const posWords = ['achieved', 'led', 'expert', 'managed', 'successful', 'delivered', 'improved', 'increased', 'developed', 'spearheaded', 'innovated'];
                        foundKeywords = posWords.filter(w => lowerText.includes(w)).slice(0, 3);
                        const kwString = foundKeywords.length > 0 ? foundKeywords.map(w => `'${w}'`).join(', ') : 'action-oriented verbs';
                        insightText = `The tone is professional and results-oriented, featuring strong action verbs like ${kwString}.`;
                    } else if (sentimentResult.label === 'NEGATIVE') {
                        const negWords = ['failed', 'issue', 'lack', 'poor', 'struggled', 'unable', 'limited', 'problem', 'delayed', 'gap', 'quit'];
                        foundKeywords = negWords.filter(w => lowerText.includes(w)).slice(0, 3);
                        const kwString = foundKeywords.length > 0 ? foundKeywords.map(w => `'${w}'`).join(', ') : 'passive or cautious phrasing';
                        insightText = `The analysis detected a cautious or risk-heavy tone, potentially due to words like ${kwString}.`;
                    } else {
                        insightText = "The tone is neutral and factual, avoiding strong emotional or polarizing vocabulary.";
                    }
                    
                    insightsEl.textContent = insightText;
                }
                //-------------------------------------
                
                sentimentIcon.classList.remove('ph-spinner', 'ph-spin');
                if (sentimentResult.label === 'POSITIVE') {
                    sentimentIcon.classList.add('ph-smiley');
                    sentimentIcon.style.color = 'var(--accent-green)';
                    sentimentLabel.style.color = 'var(--accent-green)';
                } else if (sentimentResult.label === 'NEGATIVE') {
                    sentimentIcon.classList.add('ph-smiley-sad');
                    sentimentIcon.style.color = 'var(--accent-red)';
                    sentimentLabel.style.color = 'var(--accent-red)';
                } else {
                    sentimentIcon.classList.add('ph-smiley-meh');
                    sentimentIcon.style.color = 'var(--accent-blue)';
                    sentimentLabel.style.color = 'var(--accent-blue)';
                }
            } else {
                sentimentLabel.textContent = "Analysis Failed";
                sentimentScoreText.textContent = "Could not parse sentiment.";
                
                const insightsEl = document.getElementById('sentiment-insights-text');
                if (insightsEl) insightsEl.textContent = "System error during tone extraction.";

                sentimentIcon.className = "ph ph-warning";
                sentimentIcon.style.color = "var(--accent-red)";
            }

        } catch (error) {
            console.error("Analysis Pipeline Error:", error);
            alert(`Analysis Failed: ${error.message || error}\nPlease check the Developer Console for more details.`);
            resultsLoading.classList.add('hidden');
            resultsIdle.classList.remove('hidden');
        }
    });

    function renderResults(data) {
        // UI State -> Dashboard
        resultsLoading.classList.add('hidden');
        resultsDashboard.classList.remove('hidden');

        // Update Score Circular Animation
        const scoreCircle = document.getElementById('score-circle');
        const scoreText = document.getElementById('score-text');

        // Reset animation
        scoreCircle.style.strokeDasharray = '0, 100';

        setTimeout(() => {
            scoreCircle.style.strokeDasharray = `${data.score}, 100`;
            animateValue(scoreText, 0, data.score, 1500);

            // Color based on score
            if (data.score >= 85) scoreCircle.style.stroke = 'var(--accent-green)';
            else if (data.score >= 65) scoreCircle.style.stroke = 'var(--accent-blue)';
            else scoreCircle.style.stroke = 'var(--accent-red)';
        }, 100);

        // Update texts
        document.getElementById('candidate-name').textContent = data.candidateName;
        document.getElementById('final-decision').textContent = data.verdict;
        document.getElementById('decision-subtitle').textContent = `AI Confidence Score`;

        // Populate Summary
        document.getElementById('report-summary-text').textContent = data.summary;

        // Populate Granular Scores
        document.getElementById('industry-fit-score').textContent = `${data.industryFitScore}/100`;
        document.getElementById('industry-fit-rationale').textContent = data.industryFitRationale;

        document.getElementById('jd-match-score').textContent = `${data.jdMatchScore}/100`;
        document.getElementById('jd-match-rationale').textContent = data.jdMatchRationale;

        // Populate Working Rights
        const wrStatusEl = document.getElementById('working-rights-status');
        wrStatusEl.textContent = data.workingRightsStatus;
        document.getElementById('working-rights-rationale').textContent = data.workingRightsRationale;
        
        // Color code the working rights status
        wrStatusEl.style.color = 'var(--text-color)'; // default
        if (data.workingRightsStatus.includes('Eligible')) {
            wrStatusEl.style.color = '#10b981'; // green
        } else if (data.workingRightsStatus.includes('Risk') || data.workingRightsStatus.includes('Flagged')) {
            wrStatusEl.style.color = '#ef4444'; // red
        } else if (data.workingRightsStatus.includes('Unknown') || data.workingRightsStatus.includes('Pending')) {
            wrStatusEl.style.color = '#f59e0b'; // orange/yellow
        }

        // Populate Lists
        const prosList = document.getElementById('pros-list');
        const consList = document.getElementById('cons-list');

        prosList.innerHTML = '';
        data.pros.forEach(list => {
            const li = document.createElement('li');
            li.textContent = list;
            prosList.appendChild(li);
        });

        consList.innerHTML = '';
        data.cons.forEach(list => {
            const li = document.createElement('li');
            li.textContent = list;
            consList.appendChild(li);
        });

        // Detailed Eval and Conclusion
        document.getElementById('detailed-eval-text').textContent = data.detailedEval;
        document.getElementById('conclusion-text').textContent = data.conclusion;
    }

    // Number animation utility
    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start) + '%';
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // Export to PDF functionality - Native Print Window Strategy
    exportPdfBtn.addEventListener('click', () => {
        const originalBtnText = exportPdfBtn.innerHTML;
        exportPdfBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Preparing Print...';
        exportPdfBtn.disabled = true;

        setTimeout(() => {
            const dashboard = document.getElementById('results-dashboard');
            
            // Open a new window
            const printWindow = window.open('', '_blank', 'width=1200,height=900');
            
            if (!printWindow) {
                alert("Please allow popups to generate the PDF report.");
                exportPdfBtn.innerHTML = originalBtnText;
                exportPdfBtn.disabled = false;
                return;
            }

            // Get absolute paths for assets (handles file:// protocols properly)
            const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);

            // Build the HTML for the new window
            const printHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Analysis Report</title>
                <base href="${baseUrl}">
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                <script src="https://unpkg.com/@phosphor-icons/web"></script>
                <link rel="stylesheet" href="css/styles.css">
                <style>
                    /* Print-specific Overrides to preserve Dark Theme */
                    body, html {
                        background-color: #0a192f !important;
                        color: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        margin: 0;
                        padding: 0;
                        width: 100%;
                    }
                    
                    body.dark-theme {
                        padding: 15px;
                        background-image: none !important;
                        background: #0a192f !important;
                    }

                    #results-dashboard {
                        display: block !important;
                        width: 100%;
                    }

                    /* 1. Remove Forced Gaps & Compact Grid */
                    .dashboard-grid {
                        display: grid !important;
                        grid-template-columns: 1fr 1fr !important; /* Force 2-columns */
                        gap: 15px !important;
                        margin-bottom: 15px !important;
                    }

                    .dashboard-card {
                        margin: 0 !important;
                        padding: 15px !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        page-break-before: auto !important; /* Allow wrapping */
                        break-before: auto !important;
                        width: 100% !important;
                        box-sizing: border-box;
                    }

                    /* Important: specifically protect full-width cards in grid */
                    .dashboard-card[style*="column: 1 / -1"] {
                        grid-column: 1 / -1 !important;
                    }

                    /* 2. Reduce font size by 10% for compactness */
                    p, ul, li {
                        font-size: 0.9em !important;
                        line-height: 1.4 !important;
                    }

                    .pdf-page-break {
                        page-break-before: auto !important;
                        break-before: auto !important;
                    }

                    /* Force backgrounds to render on browsers */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        box-sizing: border-box;
                    }

                    /* 3. Hide Browser Artifacts */
                    @media print {
                        @page {
                            margin: 0 !important; /* Removes header/footer texts generated by browser */
                            size: A4 portrait;
                        }
                        body {
                            background-color: #0a192f !important;
                            padding: 15mm !important; /* Re-add padding safely away from hardware margins */
                        }
                        /* Ensure no blank outer edges */
                        html {
                            background-color: #0a192f !important;
                        }
                    }
                </style>
            </head>
            <body class="dark-theme">
                <div class="workspace" style="display:block; padding:0;">
                    <div class="results-section" style="padding:0;">
                        ${dashboard.outerHTML}
                    </div>
                </div>
                <script>
                    // Remove buttons in print view so they don't show on PDF
                    const actions = document.querySelector('.dashboard-actions');
                    if(actions) actions.style.display = 'none';

                    // Wait 1 second for Phosphor Icons and Inter Font to fully load from CDN
                    setTimeout(() => {
                        window.print();
                        window.close();
                    }, 1000);
                </script>
            </body>
            </html>
            `;
            
            printWindow.document.open();
            printWindow.document.write(printHtml);
            printWindow.document.close();

            exportPdfBtn.innerHTML = originalBtnText;
            exportPdfBtn.disabled = false;
        }, 100);
    });

    // Background Model Preloading
    // Kick off silent downloads of the neural networks immediately on page load
    // so they are ready in RAM by the time the user clicks Analyze
    setTimeout(async () => {
        try {
            console.log("[AI System] Initiating background preloads...");
            if (window.AIService && typeof window.AIService.preload === 'function') {
                AIService.preload();
            }
            
            // Preload Sentiment Model
            const transformers = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers');
            transformers.env.allowLocalModels = false;
            transformers.env.useBrowserCache = true;
            sentimentClassifier = await transformers.pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
            console.log("[AI System] Sentiment model pre-loaded successfully.");
        } catch (e) {
            console.warn("[AI System] Background preloading failed. Models will load on-demand.", e);
        }
    }, 1000); // 1 second delay to prioritize primary UI rendering
});
