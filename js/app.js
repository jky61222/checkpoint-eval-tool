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

    // Export to PDF functionality - Native Browser Print
    exportPdfBtn.addEventListener('click', () => {
        // Trigger the browser's native print dialog, allowing the user to "Save as PDF"
        window.print();
    });
});
