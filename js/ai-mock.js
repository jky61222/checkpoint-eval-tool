// Mock AI service to simulate LLM logic based on CV and JD matching

class AIService {
    // Simple fast string hashing to generate a deterministic seed
    static hashString(str) {
        let hash = 0;
        if (!str || str.length === 0) return hash;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    // Helper to extract a mock name from CV text (in reality, an LLM would extract this)
    static extractMockName(cvText) {
        // very basic mock extraction based on standard CV structure (first words)
        const words = cvText.trim().split(/\s+/).slice(0, 2);
        if (words.length === 2 && words[0].length > 1 && words[1].length > 1) {
            // Capitalize format
            return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        }
        return "Alex Mercer"; // Fallback mock name
    }

    static extractKeywords(text, count = 5) {
        if (!text) return ["Operations Strategy", "Process Management", "Business Development", "Project Leadership", "Cross-functional Alignment"];
        
        // Pre-process specific terms into enterprise equivalents
        let normalizedText = text.replace(/(?:\bms\s+office\b|\bmicrosoft\s+office\b)/ig, 'Microsoft Office 365');
        
        // Remove URLs (http, https, www) so domains aren't extracted as skills
        normalizedText = normalizedText.replace(/(?:https?:\/\/[^\s]+|www\.[^\s]+)/ig, ' ');
        
        // Remove common resume boilerplate phrases that aren't skills
        normalizedText = normalizedText.replace(/identity & verification linkedin verified/ig, ' ');
        normalizedText = normalizedText.replace(/identity & verification/ig, ' ');
        normalizedText = normalizedText.replace(/identity verification/ig, ' ');
        normalizedText = normalizedText.replace(/linkedin verified/ig, ' ');
        
        // Remove known recruitment vendors so they don't pollute the keyword extraction
        normalizedText = normalizedText.replace(/\b(?:michael page|robert walters|computer futures|hays|adecco|randstad|manpower|kforce|teksystems|modis|robert half|pagepersonnel|michaelpage)\b/ig, ' ');
        
        // Extensive list of common English and resume-fluff stop words to filter out
        const stopWords = new Set(['about', 'after', 'all', 'also', 'and', 'another', 'any', 'are', 'because', 'been', 'before', 'being', 'between', 'both', 'but', 'came', 'can', 'come', 'could', 'did', 'each', 'for', 'from', 'get', 'got', 'has', 'had', 'have', 'her', 'here', 'him', 'himself', 'his', 'how', 'into', 'its', 'like', 'make', 'many', 'might', 'more', 'most', 'much', 'must', 'never', 'now', 'only', 'other', 'our', 'out', 'over', 'said', 'same', 'see', 'should', 'since', 'some', 'still', 'such', 'take', 'than', 'that', 'the', 'their', 'them', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'too', 'under', 'very', 'was', 'way', 'well', 'were', 'what', 'where', 'which', 'while', 'who', 'with', 'would', 'you', 'your', 'experience', 'project', 'team', 'business', 'work', 'working', 'using', 'used', 'new', 'years', 'skills', 'role', 'roles', 'responsibilities', 'responsible', 'including', 'included', 'strong', 'ability', 'developed', 'managed', 'created', 'various', 'within', 'high', 'multiple']);

        // Clean text and split by spaces
        const words = normalizedText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
        const frequencies = {};

        // Extract 2-word and 3-word phrases (n-grams) to get concepts rather than single words
        for (let i = 0; i < words.length - 1; i++) {
            const w1 = words[i];
            const w2 = words[i + 1];
            
            // Skip phrases that start or end with a stop word
            if (stopWords.has(w1) || stopWords.has(w2)) continue;
            
            const bigram = `${w1} ${w2}`;
            frequencies[bigram] = (frequencies[bigram] || 0) + 1;

            if (i < words.length - 2) {
                const w3 = words[i + 2];
                if (!stopWords.has(w3)) {
                    const trigram = `${w1} ${w2} ${w3}`;
                    frequencies[trigram] = (frequencies[trigram] || 0) + 1.5; // Weight trigrams slightly higher
                }
            }
        }
        
        // Fallback to single words if no good phrases found
        if (Object.keys(frequencies).length < count) {
            words.forEach(word => {
                if (!stopWords.has(word) && word.length > 4) {
                    frequencies[word] = (frequencies[word] || 0) + 0.5;
                }
            });
        }

        // Sort by weighted frequency, then by length
        const sorted = Object.keys(frequencies).sort((a, b) => {
            // Priority weighting function
            const getWeight = (phrase) => {
                let weight = frequencies[phrase];
                // Deeply penalize generic operational tools so they only appear if nothing else exists
                if (phrase.includes('microsoft office') || phrase.includes('office 365') || phrase.includes('excel') || phrase.includes('spreadsheet') || phrase.includes('word docs')) {
                    weight -= 10;
                }
                // Boost high-impact technical, leadership, and strategic terms (Working Experience)
                const highValueTerms = ['security', 'cloud', 'architecture', 'strategy', 'leadership', 'management', 'development', 'engineer', 'network', 'infrastructure', 'firewall', 'deployment', 'operations', 'integration'];
                if (highValueTerms.some(term => phrase.includes(term))) {
                    weight += 3; // Bonus weight
                }
                return weight;
            };

            const weightA = getWeight(a);
            const weightB = getWeight(b);

            if (weightB === weightA) {
                return b.length - a.length; // Prefer longer phrases if frequency ties
            }
            return weightB - weightA;
        });

        // Use Set to ensure uniqueness (e.g., prevent "sales manager" and "regional sales manager" taking up two spots)
        const uniqueConcepts = [];
        for (const phrase of sorted) {
            let isDuplicate = false;
            for (const existing of uniqueConcepts) {
                if (existing.includes(phrase) || phrase.includes(existing)) {
                    isDuplicate = true;
                    break;
                }
            }
            if (!isDuplicate) {
                // Capitalize each word in the phrase
                uniqueConcepts.push(phrase.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
            }
            if (uniqueConcepts.length >= count) break;
        }

        // Fallbacks if document is too short or empty
        const fallbacks = ["Strategic Execution", "Process Optimization", "Client Success", "Technical Operations", "Enterprise Workflows"];
        while (uniqueConcepts.length < count) {
            uniqueConcepts.push(fallbacks[uniqueConcepts.length]);
        }
        return uniqueConcepts;
    }

    static async analyze(cvText, jdText) {
        // Simulate network delay (2-3 seconds)
        await new Promise(resolve => setTimeout(resolve, 2500));

        // Generate tailored mock response
        const hasJD = jdText && jdText.length > 50;
        const candidateName = this.extractMockName(cvText);

        // Extract real contextual keywords from the parsed text!
        const cvKeys = this.extractKeywords(cvText, 5);
        const jdKeys = hasJD ? this.extractKeywords(jdText, 5) : [];

        // Build a DETERMINISTIC pseudo-random generator seeded by the hashed document text
        const combinedText = (cvText || "") + (jdText || "");
        let currentSeed = this.hashString(combinedText);

        const rng = {
            next: function () {
                currentSeed = (currentSeed * 9301 + 49297) % 233280;
                return currentSeed / 233280;
            },
            pick: function (arr) {
                return arr[Math.floor(this.next() * arr.length)];
            }
        };

        const combinedTextLower = combinedText.toLowerCase();
        const cpMatches = (combinedTextLower.match(/check point|checkpoint|quantum|cloudguard|harmony|infinity|saas|channel/g) || []).length;

        // Calculate a logical semantic overlap score instead of pure random generation
        let rawScore = 40; // baseline
        let matchCount = 0;
        
        if (hasJD) {
            const cvKeyStrings = cvKeys.map(k => k.toLowerCase());
            const jdKeyStrings = jdKeys.map(k => k.toLowerCase());
            
            // Check direct or partial overlaps between CV and JD concepts
            jdKeyStrings.forEach(jdKey => {
                const jdWords = jdKey.split(' ');
                cvKeyStrings.forEach(cvKey => {
                    if (cvKey.includes(jdKey) || jdKey.includes(cvKey)) {
                        matchCount += 1.5; // Strong phrase overlap
                    } else {
                        // Check if at least one meaningful word overlaps
                        jdWords.forEach(w => {
                            if (w.length > 3 && cvKey.includes(w)) {
                                matchCount += 0.5; // Partial word overlap
                            }
                        });
                    }
                });
            });
            
            // Boost score based on overlaps and Check Point familiarity
            rawScore += (matchCount * 8);
            rawScore += (cpMatches * 5);
        } else {
            rawScore += (cpMatches * 10);
        }

        // Add minimal entropy for slight variance using the seeded RNG
        let score = Math.min(Math.max(Math.floor(rawScore + (rng.next() * 15)), 25), 98);
        if (!hasJD) score -= 15; // Penalize lack of contextual JD for mock purposes

        let verdict = "Solid Match";
        if (score >= 75) verdict = "Strong Hire";
        else if (score < 50) verdict = "Do Not Advance";
        else verdict = "Preliminary Screening";

        let summary, pros, cons, detailedEval, conclusion;
        let industryFitScore, industryFitRationale;
        let jdMatchScore, jdMatchRationale;

        if (hasJD) {
            // Detect Role Context via weighted scoring to prevent false positives (e.g., HR "Partner")
            const salesMatches = (combinedTextLower.match(/sales|quota|territory|revenue|business development|account executive|account manager/g) || []).length;
            const techMatches = (combinedTextLower.match(/engineer|developer|architecture|technical|deployment|security|cloud|network/g) || []).length;
            const corpMatches = (combinedTextLower.match(/hr|human resources|finance|legal|general counsel|marketing|operations|recruitment|controller/g) || []).length;
            
            let isCorpRole = false;
            let isSalesRole = false;
            let isTechRole = true; // default to technical in cybersecurity context unless proven otherwise
            
            if (corpMatches > techMatches && corpMatches > salesMatches) {
                isCorpRole = true;
                isTechRole = false;
            } else if (salesMatches > techMatches) {
                isSalesRole = true;
                isTechRole = false;
            }

            summary = [
                `Executive Overview: Comprehensive semantic analysis indicates ${candidateName} satisfies approximately ${score}% of the ${isCorpRole ? 'core operational and strategic' : 'primary technical and architectural'} requirements defined in the requisition.`,
                rng.pick([
                    `By correlating their documented history with ${cvKeys[0]} against the primary mandate for ${jdKeys[0]}, the model identifies a ${score >= 70 ? 'high-confidence' : 'low-confidence'} structural fit.`,
                    `The candidate's historical velocity in ${cvKeys[0]} was synthesized against the immediate demands of ${jdKeys[0]}, revealing they ${score >= 70 ? 'demonstrate the necessary leverage' : 'lack the demonstrated leverage'} to execute at the required standard.`,
                    `An algorithmic review of their tenure in ${cvKeys[0]} establishes a competency baseline that ${score >= 70 ? 'strongly intersects' : 'marginally overlaps'} with your stated requirement for ${jdKeys[0]}.`
                ]),
                rng.pick([
                    `Furthermore, predictive modeling suggests an ability to pivot their knowledge of ${cvKeys[1]} to meet the daily demands of your ${jdKeys[1]} ${isCorpRole ? 'business unit' : 'infrastructure'}.`,
                    `Leveraging their past exposure to ${cvKeys[1]}, we project a rapid assimilation curve into a ${jdKeys[1]} environment.`,
                    `The transition from their prior ${cvKeys[1]} deployments to your ${jdKeys[1]} ${isCorpRole ? 'frameworks' : 'frameworks'} presents a highly viable integration pathway.`
                ])
            ].join(' ');

            industryFitScore = Math.min(score + Math.floor(rng.next() * 10), 100);
            
            if (isCorpRole) {
                industryFitRationale = rng.pick([
                    `High-Fidelity Corporate Alignment. Their demonstrated efficacy in ${cvKeys[2]} translates exceptionally well to Check Point's internal ecosystem. The trajectory of their history suggests execution capability at a scale commensurate with our global enterprise tempo.`,
                    `Sector synergy is primarily driven by their established success managing ${cvKeys[2]}. Having navigated parallel organizational complexities, ${candidateName} possesses the structural awareness required for Check Point's matrixed corporate environments.`,
                    `Linguistic analysis indicates extensive exposure to managing ${cvKeys[2]} at a multi-regional or enterprise tier. This serves as a strong prognostic indicator for comprehending the operational and administrative demands of a tier-1 cybersecurity vendor.`
                ]);
            } else {
                industryFitRationale = rng.pick([
                    `Strong Cybersecurity Posture Alignment. Their hands-on expertise engineering ${cvKeys[2]} translates directly to the Check Point ecosystem, validating their ability to match our enterprise tempo and prevention-first methodology.`,
                    `Sector logic indicates high alignment. Having navigated complex security topologies involving ${cvKeys[2]}, ${candidateName} possesses the contextual awareness required to architect, position, and support Check Point environments effectively.`,
                    `The analysis indicates extensive exposure to mitigating risk via ${cvKeys[2]} against modern threat landscapes. This is a definitive indicator they comprehend the strict operational demands of deploying enterprise-grade Check Point architectures.`
                ]);
            }

            jdMatchScore = Math.max(Math.min(score + (cpMatches * 2) - Math.floor(rng.next() * 5), 100), 0);
            

            if (isCorpRole) {
                jdMatchRationale = `Requirement Matrix Match: High statistical alignment with primary operational duties. The model explicitly maps their proficiency in ${cvKeys[0]} directly to your requested ${jdKeys[0]} capacity. Process Enablement: Definitive evidence of cross-functional workflows driven by ${cvKeys[3]}. Identified Deficit: A potential delta regarding your secondary requirement for ${jdKeys[4]}, necessitating targeted validation.`;
            } else if (isSalesRole) {
                jdMatchRationale = `Check Point Go-to-Market Alignment: Direct correlation between their tenure executing ${cvKeys[0]} and your requested ${jdKeys[0]} pipeline methodology. Market Penetration: Experience navigating complex channel-led models utilizing ${cvKeys[3]}. Identified Deficit: A minor knowledge gap regarding advanced integrations of ${jdKeys[4]}, solvable via Check Point Infinity enablement.`;
            } else {
                jdMatchRationale = `Check Point Technical Ecosystem Match: Strong architectural alignment bridging their hands-on deployment of ${cvKeys[0]} against your core requirement for ${jdKeys[0]}. Security Posture: Empirical evidence of a prevent-first mindset driven by ${cvKeys[3]}. Identified Deficit: A minor tactical gap regarding advanced edge cases of ${jdKeys[4]} within the Check Point Infinity suite.`;
            }

            if (score < 50) {
                pros = [
                    `Baseline Professionalism: Algorithmic parsing confirms a documented work history, demonstrating foundational exposure to ${cvKeys[0]}.`,
                    `Alternative Tangential Perspectives: Their background in ${cvKeys[1]} offers a divergent operational perspective, though it correlates poorly with your immediate mandate for ${jdKeys[0]}.`
                ];
                cons = [
                    `Critical Capability Deficit: The model identifies an unacceptable delta between their primary experience in ${cvKeys[0]} and the mandatory requirement for ${jdKeys[0]}.`,
                    `Methodological Misalignment: The requisition demands high-level fluency in ${jdKeys[1] || 'specific scaling workflows'}, whereas the candidate's parsed history lacks verifiable success metrics in this specific discipline.`,
                    `Operational Scope Asymmetry: Their recent engagements utilizing ${cvKeys[2]} do not establish the necessary scale, complexity, or operational tempo required for this Check Point requisition.`,
                    `Domain Specificity Mismatch: Highly specialized, enterprise-tier application of ${jdKeys[2] || 'core tooling'}—a core pillar of the JD—is statistically absent from the evaluated documentation.`
                ];
            } else {
                pros = [
                    rng.pick([
                        `High-Fidelity Requirement Matrixing: Semantic analysis reveals the candidate's background in ${cvKeys[0] || 'core operations'} strongly correlates with the primary JD requirement for ${jdKeys[0] || 'core function'}, indicating low onboarding friction.`,
                        `Strategic Competency Alignment: Their demonstrated proficiency in ${cvKeys[0]} directly addresses the critical path ${jdKeys[0]} mandate outlined in the requisition.`
                    ]),
                    rng.pick([
                        `Complementary Technical Synergy: Discovered strong documented evidence of execution within the ${cvKeys[1]} landscape, serving as a powerful force multiplier for your requirement for ${jdKeys[1]}.`,
                        `Strategic Trajectory Overlap: The parser identified a clear history of navigating initiatives spanning ${cvKeys[1]}, intersecting perfectly with the JD's stated focus on ${jdKeys[1]}.`
                    ]),
                    rng.pick([
                        `Proven Enterprise Impact: Demonstrates a history of delivering multi-phase projects utilizing ${cvKeys[2]} to drive quantifiable outcomes, satisfying the core need for ${jdKeys[2] || 'operational excellence'}.`,
                        `Metric-Driven Execution: Consistently leverages ${cvKeys[2]} to optimize results, mapping efficiently to the KPI expectations for ${jdKeys[2] || 'the target role'}.`
                    ]),
                    rng.pick([
                        `Contextual Adaptability Factor: Career progression modeling shows high competency in bridging ${cvKeys[3]} into modern enterprise architectures relevant to ${jdKeys[3] || 'infrastructure'}.`,
                        `Cross-Functional Utility: Parsed experience with ${cvKeys[3]} algorithmic predicts a high probability of stretching into the ${jdKeys[3] || 'secondary'} requirements listed by the hiring manager.`
                    ])
                ];

                cons = [
                    rng.pick([
                        `Architectural Knowledge Deficit: The JD explicitly weights ${jdKeys[3] || 'specific infrastructure'} and ${jdKeys[4] || 'advanced tools'}, but the candidate's data primarily indexes on ${cvKeys[2] || 'alternative methods'}.`,
                        `Skill Surface Area Limitation: The text analysis indicates heavy reliance on ${cvKeys[0]}, presenting a potential risk vector regarding the JD's secondary requirement of ${jdKeys[3] || 'specialized systems'}.`
                    ]),
                    rng.pick([
                        `Operational Paradigm Drift: The role requires deep fluency in ${jdKeys[2] || 'specific scaling workflows'}, but the candidate's contextual history is anchored predominantly in ${cvKeys[3] || 'legacy'} models.`,
                        `Tenure/Scale Asymmetry: Their rapid advancement through recent roles utilizing ${cvKeys[1]} requires human vetting against the highly specific ${jdKeys[2] || 'seniority'} requirements of this enterprise scale.`
                    ]),
                    rng.pick([
                        `Niche Domain Specificity: Natural Language Processing (NLP) flags a lack of deep, documented exposure to the exact sub-domain of ${jdKeys[4] || 'infrastructure'} targeted in the immediate roadmap.`,
                        `Ancillary Experience Gap: While foundationally robust in ${cvKeys[0]}, the highly specific, hands-on enterprise application of ${jdKeys[4] || 'our niche tooling'} is not statistically validated in the text.`
                    ])
                ];
            }

            if (score >= 75) {
                detailedEval = `1. Semantic Core Competency Mapping (Confidence Interval: 94.2%)
The neural parsing engine confirms hyper-alignment between the candidate's structural utilization of ${cvKeys[0]} and the requisition's primary mandate for ${jdKeys[0]}. The dataset exhibits an evolutionary trajectory correlating flawlessly with the seniority, autonomy, and cognitive velocity required by this Check Point requisition.

2. Strategic Delta & Environmental Agility Model
Vector analysis mapped the candidate's extracted n-grams against the specific Check Point ${isCorpRole ? 'corporate operations' : 'cybersecurity'} matrix. Statistically significant overlaps exist bridging their demonstrable experience in ${cvKeys[2]} directly to your defined need for ${jdKeys[2]}. The predictive model indicates high contextual adaptability and phenomenal onboarding efficiency.

3. Operational Leverage & Execution Telemetry
This role demands the capability to navigate complex, high-velocity environments to deliver on ${jdKeys[4] || 'core business objectives'}. The candidate's CV provides deterministic, quantifiable evidence of executing at an equivalent scale through past multi-phase initiatives involving ${cvKeys[4]}, proving they possess the structural leverage to drive targeted business outcomes.`;
            } else if (score >= 50) {
                detailedEval = `1. Semantic Core Competency Mapping (Confidence Interval: 68.5%)
The neural parsing engine reveals a foundational linguistic correlation between their history in ${cvKeys[0]} and the JD requirement for ${jdKeys[0]}, but detects a statistical lack of the progressive compounding velocity typically demanded at this tier. The model predicts they can execute baseline operations, but advanced delivery vectors represent a moderate risk profile.

2. Strategic Delta & Environmental Agility Model
Vector analysis mapped the candidate's extracted n-grams against the specific target matrix. Partial correlations exist between their experience in ${cvKeys[2]} and your defined need for ${jdKeys[2]}. However, the role algorithmically demands robust ${jdKeys[3] || 'cross-functional execution'}, whereas their parsed background indexes heavily on ${cvKeys[3] || 'rigid workflows'}. This is a critical identified friction point.

3. Operational Leverage & Execution Telemetry
This role necessitates navigating complex topologies to deliver on ${jdKeys[4] || 'core objectives'}. The candidate's dataset provides scattered, unverified evidence of this through limited initiatives involving ${cvKeys[4]}; however, semantic analysis cannot definitively determine if they architected the strategic vision or merely executed assigned tactical outputs.`;
            } else {
                detailedEval = `1. Semantic Core Competency Mapping (Confidence Interval: 12.4%)
The neural parsing engine triggers an immediate structural warning regarding core competency misalignment. A deep-dive review of their language dataset yields a near-zero semantic overlap between their historical dependency on ${cvKeys[0]} and the requested functional depth necessary for ${jdKeys[0]}.

2. Strategic Delta & Environmental Agility Model
Vector analysis identified a statistically unacceptable delta between their documented experience in ${cvKeys[2]} and the mandatory requirement for ${jdKeys[2]}. Their background data points entirely toward ${cvKeys[3] || 'isolated operational outputs'}, generating a high-confidence prediction of architectural failure within Check Point's highly collaborative, matrix-driven culture.

3. Operational Leverage & Execution Telemetry
This requisition mandates the ability to navigate complex global enterprise environments to deliver on ${jdKeys[4] || 'core business objectives'}. The candidate's telemetry lacks any verifiable evidence of operating at the necessary scale, heavily indexing on compartmentalized initiatives involving ${cvKeys[4]}. The model calculates they would be fundamentally overwhelmed by the required operational tempo.`;
            }

            let verdict, actionItems;
            if (score >= 75) {
                verdict = `High Probability Match (Advance). The AI model calculates hyper-fidelity alignment with the core strictures of this role. Semantic modeling generated a strong positive signal linking their history in ${cvKeys[0]} directly to the demand vector for ${jdKeys[0]}.`;
                actionItems = `- Deploy a targeted technical validation panel assessing the empirical depth of their hands-on architecture experience with ${jdKeys[1]} to mathematically guarantee immediate operational ROI.
- Formulate a stress-test scenario targeting their algorithmic methodology for overcoming environmental friction related to ${jdKeys[2] || 'cross-functional collaboration'}.
- Evaluate structural resilience, cognitive agility, and readiness to adopt Check Point's specific ${isCorpRole ? 'global enterprise' : 'preventative security'} doctrines.`;
            } else if (score >= 50) {
                verdict = `Borderline Match (Proceed with Caution). The AI parsing engine identifies baseline operational capacity leveraging their expertise in ${cvKeys[0]}, but flags multiple critical friction points necessitating strict human validation against ${jdKeys[0]}.`;
                actionItems = `- Mandate a focused technical/functional panel specifically stress-testing their practical, unaided application of ${jdKeys[0]} and ${jdKeys[1]}.
- Deconstruct the identified structural knowledge gap regarding ${jdKeys[3] || 'specialized tooling'}—calculate precisely what onboarding ramp (in weeks) is required to reach baseline competency.
- Run behavioral analytics questioning to empirically determine how they historically navigate highly matrixed, high-velocity operational architectures.`;
            } else {
                verdict = `Reject (Do Not Advance). The AI model calculates massive mathematical divergence from the primary mandate of ${jdKeys[0]}. Their core structural strength in ${cvKeys[0]} produces an unacceptable correlation coefficient against the immediate requisition parameters.`;
                actionItems = `- A strictly enforced, highly technical functional assessment on ${jdKeys[0]} is universally required before any further human resource expenditure.
- Calculate the total cost of ownership (TCO) required to functionally re-tool their foundational ${cvKeys[1]} skills for the Check Point infrastructure to determine if a training investment is even mathematically viable (Not Recommended).
- Re-calibrate the upstream sourcing algorithm with the Talent Acquisition team to align candidate persona expectations with current market realities.`;
            }

            conclusion = `Final Verdict & Strategic AI Recommendation: ${verdict}

Identified Risk Vectors for Human Evaluation:
- Neural Language Modeling flagged that the resume data indexes dangerously heavily on ${cvKeys[2] || 'their past primary tasks'}, leaving an unverified statistical blind spot regarding the JD's absolute requirement for ${jdKeys[4] || 'specific secondary platforms'}.
- Evaluate how their specifically documented scale of operations practically measures against the current, high-velocity ${isCorpRole ? 'corporate matrix demands' : 'technical architectural standards'} of Check Point.

Hiring Authority Action Directives:
${actionItems}`;
        } else {
            // General assessment when no JD is provided
            const salesMatches = (combinedTextLower.match(/sales|quota|territory|revenue|business development|account executive|account manager/g) || []).length;
            const techMatches = (combinedTextLower.match(/engineer|developer|architecture|technical|deployment|security|cloud|network/g) || []).length;
            const corpMatches = (combinedTextLower.match(/hr|human resources|finance|legal|general counsel|marketing|operations|recruitment|controller/g) || []).length;
            
            let isCorpRole = false;
            let isSalesRole = false;
            let isTechRole = true; // default
            
            if (corpMatches > techMatches && corpMatches > salesMatches) {
                isCorpRole = true;
                isTechRole = false;
            } else if (salesMatches > techMatches) {
                isSalesRole = true;
                isTechRole = false;
            }

            summary = [
                `Executive Overview: Initial linguistic scan of ${candidateName}'s dataset reveals a professional with a stable, upwardly mobile career trajectory algorithmically anchored around ${cvKeys[0]} and ${cvKeys[1]}.`,
                rng.pick([
                    `Due to the absence of a target Job Description, this telemetry data was benchmarked against standard Check Point Software Technologies operational baselines.`,
                    isCorpRole ? `Lacking a specific requisition mandate, the model is grading their stated responsibilities against Check Point's operational baseline and global enterprise standards.` : `Lacking a specific requisition mandate, the model is grading their stated engineering history against Check Point's technological baseline and unified security architecture.`,
                    `Generating a statistically valid positional fit within Check Point's specific structural organizations requires the precise context of a designated requisition.`
                ])
            ].join(' ');

            // Calculate a rational baseline score based on industry terminology density
            const totalMatches = salesMatches + techMatches + corpMatches + (cpMatches * 3);
            industryFitScore = Math.min(Math.max(Math.floor(55 + (totalMatches * 4) + (rng.next() * 10)), 45), 95);
            industryFitRationale = rng.pick([
                `The resume data indicates robust baseline competencies, specifically over-indexing in ${cvKeys[2]} and ${cvKeys[3]}. These translate functionally to ${isCorpRole ? 'corporate operations' : 'corporate cybersecurity'}, but calculating true synergy with Check Point's specific paradigms requires a target JD.`,
                `Experience data containing ${cvKeys[2]} demonstrates a foundational understanding of modern operational topologies. However, true predictive fit regarding Check Point's internal business model remains speculative without control data.`
            ]);

            jdMatchScore = 0;
            jdMatchRationale = rng.pick([
                `N/A. Missing Control Data (Job Description). Cannot algorithmically calculate specific Check Point product knowledge density or identify programmatic friction points.`,
                `Calculation Failed. A formal Job Description vector is strictly required to generate a matching coefficient regarding Check Point specific methodologies.`
            ]);

            pros = [
                rng.pick([
                    `Demonstrated Domain Expertise: Verified track record and progressive responsibility scaling within the ${cvKeys[0]} and ${cvKeys[2]} functional data clusters.`,
                    `Core Architectural Fundamentals: Exhibits a robust, actionable understanding of foundational mechanics within ${cvKeys[0]}, essential for rapid structural integration.`
                ]),
                rng.pick([
                    `Business Impact Articulation: Mathematically normalizes business impact utilizing ${cvKeys[1]}, frequently leveraging hard metrics to demonstrate intrinsic value—a critical required variable for Check Point roles.`,
                    `Data-Driven Strategy: Consistently frames historical achievements via measurable outcomes relating to ${cvKeys[1]} and high-level strategic alignment.`
                ]),
                rng.pick([
                    `Operational Versatility: Demonstrates high contextual adaptability based on diverse industry experience bridging ${cvKeys[3]} and ${cvKeys[4]}.`,
                    `Cross-Disciplinary Exposure: Has successfully navigated varied organizational architectures, showcasing a validated ability to context-switch across ${cvKeys[3]} boundaries.`
                ])
            ];

            cons = [
                rng.pick([
                    `Evaluation Blind Spots: The model is completely unable to assess specific Check Point cultural or functional fit without a companion Job Description outlining definitive core responsibilities.`,
                    `Contextual Strategy Vacuum: It is statistically impossible to determine if their specific execution flavor of ${cvKeys[0]} matches the current demand profile of the hiring team.`
                ]),
                rng.pick([
                    `Metric Ambiguity: While primary functional areas are well-quantified in the text, secondary enablement skills lack objective, measurable verification points.`,
                    `Imbalanced Data Detail: The resume document heavily details their primary competency but glosses over their exact familiarity regarding Check Point ecosystem intricacies.`
                ]),
                rng.pick([
                    `Unverified Seniority vs Scale: Unknown whether their historical data regarding ${cvKeys[1]} matches the current operational paradigm and high-scale enterprise demands of Check Point's global infrastructure.`,
                    `Strategic Limitations: Without algorithmic access to the target role requirements, we cannot definitively mathematically prove their ${cvKeys[1]} skills will scale appropriately.`
                ])
            ];

            detailedEval = `1. Structural Capability Modeling & Baseline Potential
${rng.pick([
                `Unsupervised neural clustering indicates the candidate has formulated a highly robust foundational architecture over their career timeline, anchored deeply in ${cvKeys[0]} and ${cvKeys[1]}. Their employment telemetry exhibits a mathematically consistent sequence of authority escalation.`,
                `By tracking their positional metadata longitudinally, the parsing engine calculates a clear vector of increasing organizational leverage focused heavily on ${cvKeys[0]}.`
            ])} This data confirms past environmental structures consistently relied on their capacity to handle compounding tiers of accountability.

2. Algorithmic Processing Limitations (Missing Target Matrix)
Without a specific requisition vector to serve as a control variable, evaluating the true strategic density of their expertise in ${cvKeys[2]} specifically as it maps to Check Point's targeted Go-to-Market strategy is statistically impossible. ${rng.pick([
                `The neural engine cannot determine if their prior "senior" engagements satisfy Check Point's rigorous, high-velocity definition of enterprise-grade execution.`,
                `What computes as profound expertise in their previous isolated environments might only register as a generalized baseline requirement within Check Point's strict operational frameworks.`
            ])}

3. Syntactic Communication & Structural Formatting
The underlying data structure and linguistic syntax chosen for their documentation demonstrate a high-fidelity approach to formal business communication, though the specific keyword density lacks the contextual targeting required for a perfect Check Point cultural match.`;
            conclusion = `Final Evaluation State: Inconclusive (Control Variable Missing). The internal model calculates strong baseline capability within the ${cvKeys[0]} cluster, but cannot mathematically verify specific alignment without a Job Description to serve as an anchor point.

Hiring Authority Action Directives:
- Require the Hiring Authority to furnish a formal Job Description specifically outlining expectations regarding ${cvKeys[1]} to enable full algorithmic validation.
- Initiate a human-led technical screen focusing on the exact depth of their ${cvKeys[2]} exposure to manually verify structural fit against Check Point's immediate requirements.
- Analyze their unverified capacity to adapt their historical knowledge of ${cvKeys[3]} into Check Point's specific ${isCorpRole ? 'matrixed corporate' : 'global enterprise security'} workflow models.`;
        }

        // LinkedIn Identity & Employment Verification Check
        const hasLinkedIn = cvText.toLowerCase().includes('linkedin.com/in/') || cvText.toLowerCase().includes('linkedin.com');
        let linkedInStatus = "";
        let linkedInDetails = "";

        if (hasLinkedIn) {
            linkedInStatus = "LinkedIn Verified";
            linkedInDetails = rng.pick([
                `Cross-referencing the provided LinkedIn URL confirmed employment history. No discrepancies found between the stated timeline at past organizations and public records. Identity mapping for ${candidateName} matches the provided documentation.`,
                `LinkedIn public profile verification complete. The recent roles involving ${cvKeys[0]} and ${cvKeys[1]} align completely with the dates and descriptions listed in this CV. No employment timeline red flags detected.`,
                `Background check via LinkedIn returned a 100% temporal match. The candidate's endorsements, skillset listings, and career progression parallel the provided resume perfectly. Automatically validated current/most recent employer.`
            ]);
        } else {
            linkedInStatus = "Not Provided / Cannot Verify";
            linkedInDetails = `The parser did not detect a valid LinkedIn profile URL (https://www.linkedin.com/in/...) within the candidate's document. Unable to perform automated public record cross-referencing for employment history verification.`;
        }

        return {
            candidateName: candidateName,
            score: score,
            verdict: verdict,
            summary: summary,
            industryFitScore: industryFitScore,
            industryFitRationale: industryFitRationale,
            jdMatchScore: jdMatchScore,
            jdMatchRationale: jdMatchRationale,
            pros: pros,
            cons: cons,
            detailedEval: detailedEval,
            conclusion: conclusion,
            linkedInStatus: linkedInStatus,
            linkedInDetails: linkedInDetails
        };
    }
}
