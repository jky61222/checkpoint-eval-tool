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
                `Executive Overview: ${candidateName} matches approximately ${score}% of the core ${isCorpRole ? 'operational' : 'technical'} requirements outlined in the job description.`,
                rng.pick([
                    `This assessment directly evaluated their demonstrated history using ${cvKeys[0]} against your primary requirement for ${jdKeys[0]}, revealing a ${score >= 70 ? 'strong' : 'partial'} foundational fit.`,
                    `The candidate's historical context in ${cvKeys[0]} was mapped to the immediate demands of ${jdKeys[0]}, indicating they ${score >= 70 ? 'exceed' : 'meet baseline'} competency expectations.`,
                    `A structural analysis of their tenure in ${cvKeys[0]} establishes a baseline that overlaps with your stated requirement for ${jdKeys[0]}.`
                ]),
                rng.pick([
                    `Furthermore, their background suggests an ability to pivot their knowledge of ${cvKeys[1]} to meet the daily demands of your ${jdKeys[1]} ${isCorpRole ? 'function' : 'stack'}.`,
                    `Leveraging past exposure to ${cvKeys[1]}, we anticipate they can rapidly assimilate into a ${jdKeys[1]} environment.`,
                    `The transition from their prior ${cvKeys[1]} deployments to your ${jdKeys[1]} infrastructure presents a tangible integration point.`
                ])
            ].join(' ');

            industryFitScore = Math.min(score + Math.floor(rng.next() * 10), 100);
            
            if (isCorpRole) {
                industryFitRationale = rng.pick([
                    `Highly Relevant Operational Experience. Their expertise in ${cvKeys[2]} translates exceptionally well to Check Point's internal corporate ecosystem. Their history suggests they operate at a scale aligned with our global enterprise tempo.`,
                    `Corporate alignment is driven by their demonstrated success with ${cvKeys[2]}. Having navigated these complex organizational challenges, ${candidateName} possesses the contextual awareness required for Check Point's matrixed environments.`,
                    `The resume indicates extensive exposure to managing ${cvKeys[2]} at an enterprise level. This is a strong indicator they comprehend the specific operational and administrative demands of a large-scale cybersecurity vendor.`
                ]);
            } else {
                industryFitRationale = rng.pick([
                    `The candidate possesses a strong background in cybersecurity verticals. Their hands-on expertise with ${cvKeys[2]} translates directly to the Check Point ecosystem, proving they align with our enterprise tempo and threat-prevention focus.`,
                    `Sector alignment is high. Having navigated complex security architectures involving ${cvKeys[2]}, ${candidateName} possesses the contextual awareness required to position and support Check Point environments effectively.`,
                    `The resume indicates extensive exposure to managing ${cvKeys[2]} against modern threat landscapes. This is a strong indicator they comprehend the specific operational demands of deploying enterprise-grade Check Point architectures.`
                ]);
            }

            jdMatchScore = Math.max(Math.min(score + (cpMatches * 2) - Math.floor(rng.next() * 5), 100), 0);
            

            if (isCorpRole) {
                jdMatchRationale = `Requirement Match: High alignment with primary operational duties, explicitly mapping their history in ${cvKeys[0]} directly to your requested ${jdKeys[0]} capability. Process Enablement: Evidence of cross-functional workflows driven by ${cvKeys[3]}. Missing Components: A potential gap regarding your secondary requirement for ${jdKeys[4]}, requiring targeted onboarding.`;
            } else if (isSalesRole) {
                jdMatchRationale = `Check Point Ecosystem & Strategy Match: Direct alignment between their experience in ${cvKeys[0]} and your requested ${jdKeys[0]} sales methodology. Market Fit: Experience navigating channel-led business models utilizing ${cvKeys[3]}. Missing Components: A minor gap regarding advanced applications of ${jdKeys[4]}, requiring Check Point Infinity training.`;
            } else {
                jdMatchRationale = `Check Point Ecosystem Match: Strong technical alignment bridging their hands-on work in ${cvKeys[0]} against your core requirement for ${jdKeys[0]}. Security Posture: Evidence of a prevent-first mindset driven by ${cvKeys[3]}. Missing Components: A minor gap regarding advanced applications of ${jdKeys[4]} within the Check Point Infinity suite.`;
            }

            if (score < 50) {
                pros = [
                    `Baseline Professionalism: The candidate exhibits a documented work history, demonstrating foundational exposure to ${cvKeys[0]}.`,
                    `Alternative Perspectives: Their background in ${cvKeys[1]} offers a different operational perspective, though it diverges significantly from your immediate requirement for ${jdKeys[0]}.`
                ];
                cons = [
                    `Critical Capability Missing: There is an unacceptable gap between their primary experience in ${cvKeys[0]} and your mandatory requirement for ${jdKeys[0]}.`,
                    `Methodology Misalignment: The role requires deep fluency in ${jdKeys[1] || 'specific scaling workflows'}, but the candidate's history completely lacks documented success in this discipline.`,
                    `Scope Asymmetry: Their recent roles utilizing ${cvKeys[2]} do not demonstrate the scale, complexity, or operational tempo needed for this Check Point requisition.`,
                    `Domain Mismatch: Highly specific, hands-on enterprise application of ${jdKeys[2] || 'core tooling'} is entirely missing from the evaluated documentation.`
                ];
            } else {
                pros = [
                    rng.pick([
                        `Direct Requirement Mapping: The candidate's background in ${cvKeys[0] || 'core operations'} strongly matches the primary JD requirement for ${jdKeys[0] || 'core function'}, indicating immediate readiness.`,
                        `Functional Alignment: Their demonstrated expertise in ${cvKeys[0]} directly addresses the ${jdKeys[0]} mandate outlined in the job description.`
                    ]),
                    rng.pick([
                        `Complementary Skillset: Strong documented evidence of execution within the ${cvKeys[1]} landscape, which effectively supports your requirement for ${jdKeys[1]}.`,
                        `Strategic Overlap: Articulates a clear history of navigating initiatives spanning ${cvKeys[1]}, aligning well with the JD's focus on ${jdKeys[1]}.`
                    ]),
                    rng.pick([
                        `Proven Impact: History of delivering multi-quarter projects utilizing ${cvKeys[2]} to drive measurable outcomes, satisfying the need for ${jdKeys[2] || 'operational excellence'}.`,
                        `Results Oriented: Consistently leverages ${cvKeys[2]} to drive improvements, mapping efficiently to the performance metrics expected for ${jdKeys[2] || 'the target role'}.`
                    ]),
                    rng.pick([
                        `Contextual Adaptability: Career progression shows alignment with bridging ${cvKeys[3]} into modern enterprise requirements relevant to ${jdKeys[3] || 'infrastructure'}.`,
                        `Cross-Functional Utility: Experience with ${cvKeys[3]} suggests an ability to stretch into the ${jdKeys[3] || 'secondary'} requirements listed by the hiring manager.`
                    ])
                ];

                cons = [
                    rng.pick([
                        `Missing Technical Context: The JD explicitly emphasizes ${jdKeys[3] || 'specific infrastructure'} and ${jdKeys[4] || 'advanced tools'}, but the resume primarily focuses on ${cvKeys[2] || 'alternative methods'}.`,
                        `Skill Surface Area Limit: The candidate indexes heavily on ${cvKeys[0]}, leaving a potential blind spot regarding the JD's secondary requirement of ${jdKeys[3] || 'specialized systems'}.`
                    ]),
                    rng.pick([
                        `Methodology Gap: The role requires deep fluency in ${jdKeys[2] || 'specific scaling workflows'}, but the candidate's history is heavily anchored in ${cvKeys[3] || 'legacy'} models.`,
                        `Experience Asymmetry: Their rapid advancement through recent roles utilizing ${cvKeys[1]} must be vetted against the highly specific ${jdKeys[2] || 'seniority'} requirements of this requisition.`
                    ]),
                    rng.pick([
                        `Domain Specificity: Lacks deep, documented exposure to the exact sub-domain of ${jdKeys[4] || 'infrastructure'} mentioned as a 'nice-to-have' in the immediate roadmap.`,
                        `Niche Experience Gap: While foundationally strong in ${cvKeys[0]}, highly specific, hands-on enterprise application of ${jdKeys[4] || 'our niche tooling'} is not explicitly detailed.`
                    ])
                ];
            }

            if (score >= 75) {
                detailedEval = `1. Role Requirements Alignment
The job description explicitly mandates expertise in ${jdKeys[0]} and ${jdKeys[1]}. A review of ${candidateName}'s history demonstrates high-fidelity, progressive utilization of ${cvKeys[0]} and ${cvKeys[1]}, which serves as a highly effective functional proxy. Their most recent roles show an evolution aligning perfectly with the seniority required by this Check Point requisition.

2. Strategy, Culture & Skill Gap Analysis
We mapped the candidate's skills against the specific JD requirements. Strong overlaps exist between their demonstrable experience in ${cvKeys[2]} and your defined need for ${jdKeys[2]}. They appear highly adaptable, though their background in ${cvKeys[3] || 'siloed governance'} should be briefly explored during screening to ensure they can navigate Check Point's matrixed environment.

3. Enterprise & Operational Mapping
This requisition requires navigating complex environments to deliver on ${jdKeys[4] || 'core business objectives'}. The candidate's CV provides clear, quantifiable evidence of similar scale through past initiatives involving ${cvKeys[4]}, proving they can operate effectively to drive targeted business outcomes alongside Check Point's internal teams.`;
            } else if (score >= 50) {
                detailedEval = `1. Role Requirements Alignment
The job description explicitly mandates expertise in ${jdKeys[0]} and ${jdKeys[1]}. A review of ${candidateName}'s history shows foundational exposure to ${cvKeys[0]}, but lacks the progressive velocity typically expected for this level. They can likely perform the baseline tasks, but advanced delivery involving ${jdKeys[1]} will require vetting.

2. Strategy, Culture & Skill Gap Analysis
We mapped the candidate's skills against the specific JD requirements. Partial overlaps exist between their experience in ${cvKeys[2]} and your defined need for ${jdKeys[2]}. However, the target role demands a strong understanding of ${jdKeys[3] || 'cross-functional execution'}, while their background heavily leans on ${cvKeys[3] || 'rigid workflows'}. This represents a specific transitional friction point that must be explored.

3. Enterprise & Operational Mapping
This role requires navigating complex environments to deliver on ${jdKeys[4] || 'core objectives'}. The candidate's CV provides some evidence of this through limited initiatives involving ${cvKeys[4]}, but it is unclear if they drove the strategy or merely executed assigned tasks.`;
            } else {
                detailedEval = `1. Role Requirements Alignment
The job description explicitly mandates expertise in ${jdKeys[0]} and ${jdKeys[1]}. A review of ${candidateName}'s history reveals a concerning misalignment; their focus on ${cvKeys[0]} does not adequately substitute for the requested depth in ${jdKeys[0]}.

2. Strategy, Culture & Skill Gap Analysis
We mapped the candidate's skills against the specific JD requirements. There is a significant gap between their experience in ${cvKeys[2]} and your defined need for ${jdKeys[2]}. Their background leans entirely on ${cvKeys[3] || 'isolated outputs'}, which suggests they would struggle to adapt to Check Point's highly matrixed, collaborative culture.

3. Enterprise & Operational Mapping
This requisition requires navigating complex enterprise environments to deliver on ${jdKeys[4] || 'core business objectives'}. The candidate's CV lacks evidence of similar scale, heavily indexing on isolated initiatives involving ${cvKeys[4]}. They would likely be overwhelmed by the operational tempo expected in this role.`;
            }

            let verdict, actionItems;
            if (score >= 75) {
                verdict = `Strongly Recommend Advancing ${candidateName}. The candidate demonstrates high-fidelity alignment with the core requirements of this role, particularly bridging their history in ${cvKeys[0]} with your need for ${jdKeys[0]}.`;
                actionItems = `- Validate the depth of their hands-on experience with ${jdKeys[1]} to ensure immediate operational impact.
- Explore their approach to overcoming challenges related to ${jdKeys[2] || 'cross-functional collaboration'}.
- Assess cultural fit and readiness to adopt Check Point's specific ${isCorpRole ? 'global enterprise' : 'preventative security'} methodologies.`;
            } else if (score >= 50) {
                verdict = `Recommend Preliminary Screening for ${candidateName}. They possess baseline capacity leveraging expertise in ${cvKeys[0]}, but present potential friction points requiring validation against ${jdKeys[0]}.`;
                actionItems = `- Conduct a targeted interview focusing explicitly on their practical exposure to ${jdKeys[0]} and ${jdKeys[1]}.
- Investigate the identified gap regarding ${jdKeys[3] || 'specialized tooling'}—determine if this requires extensive onboarding.
- Ask behavioral questions on how they navigate highly matrixed operational structures.`;
            } else {
                verdict = `Do Not Advance. ${candidateName}'s current profile indicates significant divergence from the primary mandate of ${jdKeys[0]}. Their core strength in ${cvKeys[0]} does not adequately map to the immediate requirements.`;
                actionItems = `- If pushed forward, mandates a rigorous technical/functional assessment on ${jdKeys[0]} before any further team interviews.
- Verify if their foundational ${cvKeys[1]} skills can be rapidly re-tooled for Check Point's environment to justify the training investment.
- Re-align with the recruitment team on candidate persona expectations.`;
            }

            conclusion = `Final Verdict & Strategic Recommendation: ${verdict}

Identified Skill Gaps to Evaluate:
- The candidate's resume indexes heavily on ${cvKeys[2] || 'their past primary tasks'}, leaving a potential blind spot regarding the JD's requirement for ${jdKeys[4] || 'specific secondary platforms'}.
- Evaluate how their previous scale of operations compares to the current ${isCorpRole ? 'corporate functional' : 'technical'} demands of Check Point.

Hiring Manager Action Items:
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
                `Executive Overview: A generalized scan of ${candidateName}'s resume reveals a professional with a stable, upwardly mobile career trajectory centered around ${cvKeys[0]} and ${cvKeys[1]}.`,
                rng.pick([
                    `Because no specific Job Description was provided, this analysis maps their historical output against standard enterprise requirements and the Check Point Software Technologies business strategy.`,
                    isCorpRole ? `In the absence of a target JD, we are grading their stated responsibilities against Check Point's operational baseline and global enterprise standards.` : `In the absence of a target JD, we are grading their stated responsibilities against Check Point's technological baseline and shift toward consolidated SaaS security architectures.`,
                    `Assessing true positional fit within Check Point's specific sales, R&D, or administrative organizations requires the context of the specific requisition.`
                ])
            ].join(' ');

            // Calculate a rational baseline score based on industry terminology density
            const totalMatches = salesMatches + techMatches + corpMatches + (cpMatches * 3);
            industryFitScore = Math.min(Math.max(Math.floor(55 + (totalMatches * 4) + (rng.next() * 10)), 45), 95);
            industryFitRationale = rng.pick([
                `The resume indicates baseline competencies, specifically in ${cvKeys[2]} and ${cvKeys[3]}. These translate well to ${isCorpRole ? 'corporate operations' : 'corporate cybersecurity'}, but assessing alignment with Check Point's specific functional strategies requires a target JD.`,
                `Experience with ${cvKeys[2]} demonstrates a foundational understanding of modern operational paradigms. True fit regarding Check Point's internal business model remains speculative.`
            ]);

            jdMatchScore = 0;
            jdMatchRationale = rng.pick([
                `N/A. Missing Job Description. Cannot calculate specific Check Point product knowledge density or identify programmatic gaps regarding Check Point Infinity integrations.`,
                `Calculation Failed. A Job Description text is required to generate a matching coefficient regarding Check Point specific methodologies.`
            ]);

            pros = [
                rng.pick([
                    `Demonstrated Expertise: Solid track record and progressive responsibility scaling within the ${cvKeys[0]} and ${cvKeys[2]} functional domains.`,
                    `Core Fundamentals: Exhibits a robust, actionable understanding of foundational mechanics within ${cvKeys[0]}, essential for rapid integration.`
                ]),
                rng.pick([
                    `Business Impact Articulation: Accurately communicates business impact utilizing ${cvKeys[1]}, frequently leveraging metrics to demonstrate intrinsic value—a critical skill for Check Point roles.`,
                    `Data-Driven Strategy: Consistently frames historical achievements in the context of measurable outcomes relating to ${cvKeys[1]} and strategic alignment.`
                ]),
                rng.pick([
                    `Versatility: Demonstrates high adaptability based on diverse industry experience bridging ${cvKeys[3]} and ${cvKeys[4]}.`,
                    `Cross-Disciplinary Exposure: Has navigated varied organizational architectures, showcasing an ability to context-switch across ${cvKeys[3]} boundaries.`
                ])
            ];

            cons = [
                rng.pick([
                    `Evaluation Blind Spots: Completely unable to assess specific Check Point cultural or functional fit without a companion Job Description outlining core responsibilities.`,
                    `Strategy Contextual Vacuum: It is impossible to determine if their specific flavor of ${cvKeys[0]} matches what the hiring team actually needs right now.`
                ]),
                rng.pick([
                    `Metric Ambiguity: While primary functional areas are well-quantified, secondary enablement skills lack objective, measurable outcomes.`,
                    `Imbalanced Detail: The resume heavily details their primary strength but glosses over the exact Check Point ecosystem familiarly.`
                ]),
                rng.pick([
                    `Unverified Seniority vs Scale: Unknown whether their historical experience with ${cvKeys[1]} matches the current paradigm and high-scale enterprise demands of Check Point's internal organization.`,
                    `Strategic Limitations: Without knowing the exact target role, we cannot definitively prove their ${cvKeys[1]} skills will scale appropriately.`
                ])
            ];

            detailedEval = `1. Foundational Skills & Strategic Potential
${rng.pick([
                `The candidate has built a highly robust foundational skill set over their career, anchored deeply in ${cvKeys[0]} and ${cvKeys[1]}. Their employment history exhibits a logical sequence of promotions.`,
                `By tracking their job titles, ${candidateName} demonstrates a clear path of increasing leverage focused heavily on ${cvKeys[0]}.`
            ])} This indicates past employers recognized their ability to handle increasing levels of accountability.

2. Assessment Limitations (Missing Check Point Context)
Without specific, documented role requirements to benchmark against, evaluating the true practical depth of their expertise in ${cvKeys[2]} specifically as it relates to Check Point's strategy is impossible. ${rng.pick([
                `We cannot determine if their prior "senior" experience translates directly to Check Point's definition of enterprise-grade execution.`,
                `What counts as profound expertise in their previous organization might only be a baseline requirement for driving Check Point's internal organization forward.`
            ])}

3. Communication & Business Documentation
The structural formatting and clarity suggest a professional who understands how to synthesize and present operational concepts effectively to stakeholders.`;
            conclusion = `Final Verdict & Strategic Recommendation: Inconclusive. While ${candidateName} presents as functionally fluent in ${cvKeys[0]}, an actionable hiring decision for Check Point Software Technologies requires alignment with our specific business operational strategies.

Hiring Manager Action Items:
- Identify the exact Job Description (e.g., HR Business Partner, Finance Controller, Legal Counsel) for the target Check Point corporate role.
- Re-upload this CV alongside the Job Description to generate a conclusive Check Point-tailored validation report.
- In the interim, evaluate if the candidate's core strength in ${cvKeys[1]} aligns with your immediate strategic roadmap.`;
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
