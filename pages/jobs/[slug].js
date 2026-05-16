import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { Check, AlertTriangle, Sun, Moon, Radio, BookOpen } from "lucide-react";
import { useT, SUPPORTED_LANGS, LANG_META } from "@/lib/i18n";
import DocSetCTA from "@/components/DocSetCTA";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobrisk.docset.in";

const JOB_DATA = [
  {
    slug: "computer-programmer", title: "Computer Programmer", score: 75, level: "Very High", category: "Computer & Mathematical", coverage: "~75%", blsGrowth: -10, blsDir: "Declining", icon: "Code2",
    atRisk: ["Writing boilerplate code", "Bug fixing common errors", "Code documentation", "Unit test generation", "API integration scripting"],
    protected: ["System architecture design", "Security & compliance decisions", "Client requirements translation", "Code review & mentorship", "Performance optimization"],
    insight: "Computer programmers face the highest AI exposure of any occupation studied. Anthropic's Economic Index shows 75% of programming tasks are feasible for AI automation, with Claude actively used for code generation, debugging, and documentation. Entry-level roles are being absorbed fastest.",
    bls: "Declining employment projected: -10% through 2034. AI-driven automation is eliminating routine programming roles even as overall tech employment grows.",
    evidence: "14% drop in new hiring for entry-level programmers ages 22-25. GitHub Copilot and similar tools have reduced lines-of-code output per developer while increasing solo developer productivity by 55%.",
    protection: "Complex system design, legacy code interpretation, and cross-functional technical leadership remain firmly human.",
  },
  {
    slug: "customer-service-rep", title: "Customer Service Representative", score: 70, level: "High", category: "Office & Administrative Support", coverage: "~70%", blsGrowth: -5, blsDir: "Declining", icon: "Headphones",
    atRisk: ["Answering FAQ queries", "Processing returns/refunds", "Order status updates", "Basic account changes", "Script-based troubleshooting"],
    protected: ["De-escalating emotionally volatile customers", "Handling edge-case exceptions", "Building relationship with business clients", "Complex complaints requiring discretion", "Interpreting ambiguous policies"],
    insight: "Customer service has seen significant AI deployment via chatbots, IVR systems, and LLM-powered agents. Anthropic data shows automation-first channels now resolve 60-70% of standard queries without human involvement.",
    bls: "Employment declining -5% through 2034. Chat AI is absorbing routine volume while specialized roles grow.",
    evidence: "Major retailers report 40% reduction in CSR headcount after deploying LLM-based agents. Remaining roles concentrate on complex escalations.",
    protection: "Emotional intelligence, relationship continuity, and creative exception-handling are resistant to automation.",
  },
  {
    slug: "data-entry-keyer", title: "Data Entry Keyer", score: 67, level: "High", category: "Office & Administrative Support", coverage: "~67%", blsGrowth: -8, blsDir: "Declining", icon: "Keyboard",
    atRisk: ["Transcribing handwritten records", "Copy-paste data migration", "Form field population", "Spreadsheet data entry", "Database record updates"],
    protected: ["Validating ambiguous/illegible source data", "Physical document handling", "Real-time in-person data capture", "Quality checking complex workflows", "Client-facing data intake"],
    insight: "Data entry is among the most vulnerable occupations. OCR, LLM parsing, and RPA tools automate the core task loop. Anthropic research confirms 67% task coverage.",
    bls: "Employment declining -8% through 2034. Automation is rapidly absorbing the occupation.",
    evidence: "Companies report 80%+ reduction in manual entry costs after deploying intelligent document processing. Remaining keyers focus on exception handling.",
    protection: "Physical document handling and real-time verified data capture at client sites remain human-required.",
  },
  {
    slug: "telemarketer", title: "Telemarketer", score: 65, level: "High", category: "Sales & Related", coverage: "~65%", blsGrowth: -14, blsDir: "Declining", icon: "Phone",
    atRisk: ["Cold call scripted pitches", "Lead qualification calls", "Appointment setting", "Survey administration", "Product feature recitation"],
    protected: ["Building genuine prospect rapport", "Navigating complex objections", "High-trust enterprise relationship selling", "Referral network development", "Reading emotional buying signals"],
    insight: "Telemarketing faces dual pressure: AI voice agents are automating outbound calls while privacy regulations restrict human callers. The occupation has the steepest projected BLS decline.",
    bls: "Declining -14% through 2034 — the steepest drop of any studied occupation.",
    evidence: "AI outbound call platforms report 3-5x cost savings vs. human callers. Many states now regulate AI voice calls, creating compliance complexity.",
    protection: "Complex B2B enterprise sales, trust-based relationship selling, and regulatory-sensitive campaigns require human judgment.",
  },
  {
    slug: "proofreader", title: "Proofreader", score: 63, level: "High", category: "Arts, Design, Entertainment", coverage: "~63%", blsGrowth: -3, blsDir: "Declining", icon: "FileEdit",
    atRisk: ["Grammar and spelling checks", "Punctuation correction", "Formatting consistency", "Basic style guide compliance", "Hyphenation and capitalization"],
    protected: ["Brand voice consistency across pieces", "Fact-checking domain-specific claims", "Historical/cultural accuracy review", "Legal compliance in regulated copy", "Nuanced tone calibration for audience"],
    insight: "LLMs now outperform human proofreaders on mechanical accuracy. Anthropic data shows 63% of proofreading tasks are fully automatable. Value is shifting to substantive editorial judgment.",
    bls: "Slight employment decline -3% as AI handles the mechanical layer and demand for specialized editorial roles grows.",
    evidence: "Publishing houses have cut proofreading staff 30-50% after deploying AI tools while maintaining comparable error rates.",
    protection: "Substantive editing judgment, fact verification, and brand voice expertise cannot be automated.",
  },
  {
    slug: "tax-preparer", title: "Tax Preparer", score: 62, level: "High", category: "Business & Financial Operations", coverage: "~62%", blsGrowth: -5, blsDir: "Declining", icon: "Receipt",
    atRisk: ["Standard W-2 returns", "Automated deduction identification", "Prior year comparison", "Form population and filing", "Basic schedule preparation"],
    protected: ["Complex multi-state tax planning", "Business entity restructuring advice", "Audit defense and representation", "Estate and trust tax strategy", "Real-time client advisory for life events"],
    insight: "Software like TurboTax, combined with LLMs, now handles 62% of tax preparation tasks automatically. The profession is consolidating toward complex advisory work.",
    bls: "Employment declining -5% as consumer tax software matures and absorbs simple returns.",
    evidence: "H&R Block reports 40% of consumer clients now file independently using AI-assisted tools. Remaining preparer work skews toward SMB and high-net-worth clients.",
    protection: "Proactive tax planning, audit representation, and complex multi-entity situations require credentialed expertise.",
  },
  {
    slug: "financial-analyst", title: "Financial Analyst", score: 60, level: "High", category: "Business & Financial Operations", coverage: "~60%", blsGrowth: 9, blsDir: "Flat", icon: "TrendingUp",
    atRisk: ["Earnings model updates", "Industry comparison reports", "Data aggregation and cleaning", "Standard Excel dashboard builds", "Sector summary write-ups"],
    protected: ["Management relationship and trust", "Novel investment thesis development", "Reading organizational dynamics", "Cross-border deal structuring", "Presenting to skeptical boards"],
    insight: "Financial analysis faces high AI exposure for quantitative and reporting tasks, but the profession is growing due to increased capital market complexity and AI-tool-augmented analyst productivity.",
    bls: "Modest growth projected +9% through 2034 despite automation of routine analysis.",
    evidence: "Goldman Sachs reports analysts using AI tools produce 40% more reports. Entry roles are being redefined toward higher-level synthesis.",
    protection: "Relationship management, novel thesis synthesis, and institutional judgment remain stubbornly human.",
  },
  {
    slug: "medical-transcriptionist", title: "Medical Transcriptionist", score: 57, level: "High", category: "Healthcare Support", coverage: "~57%", blsGrowth: -10, blsDir: "Declining", icon: "ClipboardList",
    atRisk: ["Standard clinical note dictation", "Structured procedure documentation", "Medication list transcription", "Discharge summary formatting", "Templated report generation"],
    protected: ["Flagging clinical inconsistencies", "Complex multi-specialty consultation notes", "Rare disease terminology", "Medicolegal documentation integrity", "Quality review of AI-generated drafts"],
    insight: "Medical speech recognition (Nuance Dragon, Ambient AI) has transformed medical transcription. Anthropic data shows 57% task coverage. The profession is pivoting toward AI-output quality reviewers.",
    bls: "Employment declining -10% through 2034. Ambient AI and EHR integration are replacing traditional transcription.",
    evidence: "Epic and Nuance partnerships have automated transcription in major health systems. 60% of hospitals now use ambient AI documentation.",
    protection: "Clinical inconsistency detection, complex multi-specialty notes, and medicolegal documentation require human oversight.",
  },
  {
    slug: "paralegal", title: "Paralegal", score: 58, level: "High", category: "Legal", coverage: "~58%", blsGrowth: 4, blsDir: "Flat", icon: "Scale",
    atRisk: ["Legal document drafting (standard contracts)", "Case law research", "Discovery document review", "Template-based pleading preparation", "Client intake questionnaires"],
    protected: ["Complex litigation strategy support", "Witness preparation", "Client relationship management", "Jurisdiction-specific procedural expertise", "Last-minute hearing preparation"],
    insight: "AI legal tools (Harvey, Clio) are automating 58% of paralegal tasks. The profession is growing in headcount as AI augments output per paralegal rather than replacing the role entirely in most firms.",
    bls: "Modest employment growth +4% projected, driven by legal AI augmentation expanding case capacity.",
    evidence: "BigLaw firms report 50% reduction in document review hours post-AI adoption. Paralegal roles are evolving toward client-facing and strategy support.",
    protection: "Courtroom support, client relationships, and complex litigation logistics remain human-required.",
  },
  {
    slug: "bookkeeping-clerk", title: "Bookkeeping Clerk", score: 55, level: "High", category: "Business & Financial Operations", coverage: "~55%", blsGrowth: -6, blsDir: "Declining", icon: "BookMarked",
    atRisk: ["Transaction categorization", "Bank reconciliation", "Accounts payable/receivable entry", "Month-end journal entries", "Payroll data entry"],
    protected: ["Cash flow advisory for SMBs", "Anomaly detection requiring business context", "Audit trail reconstruction", "Vendor dispute resolution", "Regulatory compliance interpretation"],
    insight: "Cloud accounting platforms (QuickBooks AI, Xero) automate 55% of bookkeeping tasks. The role is declining as clients move to automated reconciliation.",
    bls: "Declining -6% through 2034 as accounting automation matures.",
    evidence: "Intuit reports 70% of routine transactions categorized automatically. Bookkeeping firms are pivoting to advisory services.",
    protection: "SMB advisory, anomaly investigation, and compliance interpretation require business judgment.",
  },
  {
    slug: "technical-writer", title: "Technical Writer", score: 52, level: "High", category: "Media & Communications", coverage: "~52%", blsGrowth: 4, blsDir: "Flat", icon: "FileText",
    atRisk: ["Standard API documentation", "User guide first drafts", "Release note generation", "FAQ documentation", "Changelog summaries"],
    protected: ["Complex system architecture documentation", "Developer experience design", "SDK and tutorial sequencing", "Cross-team documentation strategy", "Visual information design"],
    insight: "LLMs can now generate first drafts of most technical documentation. AI exposure is 52%, but the profession is stable because good documentation requires deep product understanding.",
    bls: "Modest growth +4% as software proliferation outpaces AI content generation quality.",
    evidence: "Companies report 40% reduction in documentation time using AI tools. Remaining scope concentrates on high-complexity docs.",
    protection: "System architecture documentation, developer experience, and information architecture require deep domain expertise.",
  },
  {
    slug: "software-developer", title: "Software Developer", score: 52, level: "High", category: "Computer & Mathematical", coverage: "~52%", blsGrowth: 17, blsDir: "Strong Growth", icon: "Terminal",
    atRisk: ["Boilerplate code generation", "Bug detection in known patterns", "Unit test scaffolding", "Data transformation scripts", "Standard CRUD operations"],
    protected: ["System architecture and trade-off decisions", "Cross-functional product collaboration", "Security threat modeling", "Performance optimization at scale", "Novel algorithm design"],
    insight: "Software development faces 52% AI exposure but strong BLS growth. GitHub Copilot and similar tools increase developer productivity, driving more software creation — and more developers needed.",
    bls: "Strong employment growth +17% through 2034 despite AI code generation capability.",
    evidence: "GitHub reports 55% increase in code commits per developer post-Copilot adoption. Net developer employment continues to rise.",
    protection: "Architecture, security, cross-team coordination, and novel system design remain firmly human.",
  },
  {
    slug: "translator", title: "Translator", score: 48, level: "High", category: "Media & Communications", coverage: "~48%", blsGrowth: -3, blsDir: "Declining", icon: "Languages",
    atRisk: ["Technical document translation", "Standard legal translation", "News article translation", "Subtitling of scripted content", "Product documentation localization"],
    protected: ["Literary and creative translation", "Simultaneous live interpretation", "Culturally sensitive marketing adaptation", "Legal proceedings interpretation", "Dialect and regional nuance"],
    insight: "Machine translation quality has improved dramatically, with 48% of translation tasks now feasible for AI. The profession is bifurcating between commodity translation and expert interpretation.",
    bls: "Declining -3% as MT quality improves across standard document types.",
    evidence: "Major corporations report 70% reduction in translation costs using AI. Human translators are increasingly focused on post-editing and creative/legal work.",
    protection: "Simultaneous interpretation, literary translation, and culturally sensitive adaptation require native-level human judgment.",
  },
  {
    slug: "insurance-underwriter", title: "Insurance Underwriter", score: 46, level: "Moderate", category: "Finance and Insurance", coverage: "40% of tasks may be automated", blsGrowth: 2, blsDir: "Flat", icon: "Shield",
    atRisk: ["Data analysis and reporting", "Policy rating and quoting", "Compliance checking"],
    protected: ["Complex risk assessment", "Client communication and relationship-building", "Customized policy creation"],
    insight: "While AI may augment certain tasks, insurance underwriters will still need to exercise professional judgment and build relationships with clients",
    bls: "2%",
    evidence: "Some tasks may be automated, but human judgment and expertise are still required",
    protection: "Domain expertise and human interaction",
  },
  {
    slug: "market-research-analyst", title: "Market Research Analyst", score: 48, level: "Moderate", category: "Data-driven profession", coverage: "40% of tasks may be automated", blsGrowth: 0, blsDir: "Up", icon: "BarChart2",
    atRisk: ["Data collection", "Data analysis", "Report generation"],
    protected: ["Interpreting results", "Developing research designs", "Presenting findings to stakeholders"],
    insight: "While AI may augment certain tasks, market research analysts will still be needed to design studies, interpret results, and provide strategic recommendations",
    bls: "Faster than average",
    evidence: "Some tasks may be automated, but human judgment and interpretation are still required",
    protection: "Ability to think critically and provide actionable insights",
  },
  {
    slug: "accountant-auditor", title: "Accountant / Auditor", score: 45, level: "Moderate", category: "Office and administrative support", coverage: "40% of tasks may be automated", blsGrowth: 10, blsDir: "Growing", icon: "Calculator",
    atRisk: ["Data entry", "Financial statement preparation", "Compliance checking"],
    protected: ["Financial analysis", "Audit planning", "Client consultation"],
    insight: "While AI may automate some routine accounting tasks, accountants and auditors will still be needed to interpret financial data, make judgments, and provide consulting services",
    bls: "10% (faster than average)",
    evidence: "Some accounting tasks may be automated, but human judgment and expertise are still required",
    protection: "Professional certification and expertise in financial analysis and planning",
  },
  {
    slug: "management-consultant", title: "Management Consultant", score: 42, level: "Moderate", category: "Professional services", coverage: "40% of tasks may be automated", blsGrowth: 10, blsDir: "Growing", icon: "Briefcase",
    atRisk: ["Data analysis", "Report generation", "Research"],
    protected: ["Strategic planning", "Client communication", "Change management"],
    insight: "While AI may augment certain tasks, management consultants will still be needed to provide strategic guidance and implementation support",
    bls: "10% growth from 2020 to 2030",
    evidence: "Some tasks may be automated, but human judgment and expertise are still required",
    protection: "Ability to adapt to new technologies and develop soft skills",
  },
  {
    slug: "lawyer-attorney", title: "Lawyer / Attorney", score: 35, level: "Moderate", category: "Professional services", coverage: "20-30% of tasks may be automated", blsGrowth: 6, blsDir: "Growing", icon: "Gavel",
    atRisk: ["Document review", "Research", "Contract drafting"],
    protected: ["Court appearances", "Client counseling", "Negotiations"],
    insight: "While AI may augment certain legal tasks, the need for human lawyers to provide strategic guidance, advocacy, and emotional support will continue",
    bls: "6% growth from 2020 to 2030",
    evidence: "Some routine legal tasks may be automated, but human judgment and expertise are still essential",
    protection: "Developing skills in areas like data analysis, technology, and business acumen can help lawyers stay competitive",
  },
  {
    slug: "marketing-manager", title: "Marketing Manager", score: 32, level: "Moderate", category: "Management", coverage: "40%", blsGrowth: 10, blsDir: "Growing", icon: "Megaphone",
    atRisk: ["Data analysis and reporting", "Social media management", "Content creation and optimization"],
    protected: ["Strategic planning and decision-making", "Team management and leadership", "Creative campaign development"],
    insight: "Marketing managers need to focus on high-level strategic tasks and develop skills in areas like data-driven marketing and digital transformation",
    bls: "10%",
    evidence: "Some tasks may be automated, but human judgment and creativity are still essential",
    protection: "Ability to adapt to new technologies and leverage data insights",
  },
  {
    slug: "journalist-reporter", title: "Journalist/Reporter", score: 28, level: "Low", category: "Media and Communication", coverage: "25%", blsGrowth: 0, blsDir: "Down", icon: "Newspaper",
    atRisk: ["Research", "Interviewing", "Writing"],
    protected: ["Investigative reporting", "Live broadcasting", "Editorial decision-making"],
    insight: "While AI can assist with research and writing, human journalists are still needed for complex, investigative, and live reporting tasks.",
    bls: "Decline",
    evidence: "Automation of routine reporting tasks",
    protection: "Creativity and critical thinking skills",
  },
  {
    slug: "hr-specialist", title: "HR Specialist", score: 30, level: "Moderate", category: "Service-oriented", coverage: "40% of tasks may be automated", blsGrowth: 5, blsDir: "As fast as average", icon: "Users",
    atRisk: ["Data entry and record-keeping", "Benefits administration", "Recruitment and candidate screening"],
    protected: ["Strategic planning and decision-making", "Employee relations and conflict resolution", "Training and development programs"],
    insight: "HR Specialists will need to focus on high-touch, strategic tasks that require human skills and judgment",
    bls: "5%",
    evidence: "Some tasks may be automated, but human skills are still required for complex decision-making and employee interactions",
    protection: "Developing skills in strategic planning, employee relations, and training and development",
  },
  {
    slug: "graphic-designer", title: "Graphic Designer", score: 30, level: "Moderate", category: "Arts and Design", coverage: "30% of tasks can be automated or augmented", blsGrowth: 3, blsDir: "Flat", icon: "Palette",
    atRisk: ["Template design", "Basic image editing"],
    protected: ["Custom illustration", "Brand strategy development"],
    insight: "Graphic designers who can leverage AI tools to enhance their creativity and productivity will be more competitive",
    bls: "3% growth from 2024 to 2034",
    evidence: "No significant displacement evidence, but AI may change the nature of the work",
    protection: "Creativity and originality",
  },
  {
    slug: "real-estate-agent", title: "Real Estate Agent", score: 18, level: "Low", category: "Sales and Related Occupations", coverage: "Limited automation potential due to high human interaction and local market knowledge", blsGrowth: 6, blsDir: "Growing", icon: "Home",
    atRisk: ["Data entry", "Market research"],
    protected: ["Client consultation", "Negotiation", "Local market expertise"],
    insight: "While AI may augment certain tasks, the core of real estate work requires human interaction, local knowledge, and complex decision-making",
    bls: "6% growth from 2024 to 2034",
    evidence: "No significant displacement evidence found",
    protection: "High level of human interaction and local market expertise",
  },
  {
    slug: "registered-nurse", title: "Registered Nurse", score: 28, level: "Moderate", category: "Healthcare", coverage: "20-40%", blsGrowth: 0, blsDir: "Increasing", icon: "Stethoscope",
    atRisk: ["Data entry", "Basic patient information collection"],
    protected: ["Complex patient care", "Emotional support", "High-level decision making"],
    insight: "While some tasks may be automated, the core of nursing work requires human skills and empathy, making it less susceptible to full automation",
    bls: "Strong Growth",
    evidence: "No evidence of significant displacement",
    protection: "High human touch and empathy requirements",
  },
  {
    slug: "high-school-teacher", title: "High School Teacher", score: 22, level: "Moderate", category: "Education", coverage: "22% of tasks are at risk of being automated or augmented", blsGrowth: 4, blsDir: "Flat", icon: "GraduationCap",
    atRisk: ["Grading", "Lesson planning", "Data entry"],
    protected: ["Classroom instruction", "Student mentoring", "Parent-teacher conferences"],
    insight: "High school teachers will need to focus on developing skills that complement AI, such as critical thinking and creativity",
    bls: "4% growth from 2024-2034",
    evidence: "No significant displacement of teachers due to AI",
    protection: "Human interaction and emotional intelligence",
  },
  {
    slug: "architect", title: "Architect", score: 25, level: "Moderate", category: "Design and Planning", coverage: "20-40%", blsGrowth: 10, blsDir: "Growing", icon: "Building2",
    atRisk: ["Building design", "Space planning"],
    protected: ["Client consultation", "Site analysis", "Construction administration"],
    insight: "Architects who adapt to AI-assisted design tools and develop skills in data analysis and sustainability will be more competitive",
    bls: "10%",
    evidence: "No significant displacement expected",
    protection: "Creativity and human judgment",
  },
  {
    slug: "pharmacist", title: "Pharmacist", score: 25, level: "Moderate", category: "Healthcare", coverage: "20-30% of tasks are at risk of automation", blsGrowth: 6, blsDir: "Growing", icon: "Pill",
    atRisk: ["Data entry for patient records", "Automated medication dispensing"],
    protected: ["Patient counseling", "Clinical decision-making"],
    insight: "Pharmacists will need to develop skills in AI-assisted clinical decision support and patient counseling to remain competitive",
    bls: "6% growth from 2024-2034",
    evidence: "No significant displacement of pharmacists due to AI",
    protection: "Clinical expertise and patient interaction skills",
  },
  {
    slug: "psychologist", title: "Psychologist", score: 15, level: "Low", category: "Healthcare", coverage: "Limited AI applications in core tasks", blsGrowth: 19, blsDir: "Increasing", icon: "Brain",
    atRisk: ["Data entry for patient records", "Basic research tasks"],
    protected: ["Therapy sessions", "Complex diagnosis", "Personalized treatment planning"],
    insight: "Psychologists will work alongside AI to enhance patient care, not replace it",
    bls: "19% growth from 2024 to 2034",
    evidence: "No significant displacement expected",
    protection: "Human empathy and complex decision-making",
  },
  {
    slug: "police-officer", title: "Police Officer", score: 12, level: "Low", category: "Law Enforcement", coverage: "Limited AI applications in law enforcement", blsGrowth: 5, blsDir: "Steady", icon: "ShieldCheck",
    atRisk: ["Data entry", "Report writing"],
    protected: ["Patrolling", "Emergency response", "Community engagement"],
    insight: "AI is more likely to augment police work than replace it",
    bls: "5% growth from 2024 to 2034",
    evidence: "No significant displacement expected",
    protection: "Human interaction and complex decision-making",
  },
  {
    slug: "veterinarian", title: "Veterinarian", score: 12, level: "Low", category: "Healthcare", coverage: "Limited AI applications in veterinary care", blsGrowth: 18, blsDir: "Increasing", icon: "HeartPulse",
    atRisk: ["Data entry", "Basic diagnostic analysis"],
    protected: ["Surgery", "Complex diagnosis", "Client communication"],
    insight: "Veterinarians will work alongside AI systems to enhance patient care and outcomes",
    bls: "18% growth from 2024 to 2034",
    evidence: "No evidence of AI-related job displacement",
    protection: "High-touch, high-empathy aspects of veterinary care",
  },
  {
    slug: "physical-therapist", title: "Physical Therapist", score: 10, level: "Low", category: "Healthcare", coverage: "5-10%", blsGrowth: 17, blsDir: "Increasing", icon: "Activity",
    atRisk: ["Documentation", "Insurance claims processing"],
    protected: ["Manual therapy", "Patient assessment", "Treatment planning"],
    insight: "Physical therapists will work alongside AI for data analysis and patient monitoring",
    bls: "17% growth from 2024-2034",
    evidence: "No evidence of job displacement due to AI",
    protection: "Human interaction and empathy",
  },
  {
    slug: "chef-head-cook", title: "Chefs and Head Cooks", score: 5, level: "Minimal", category: "Service", coverage: "Near 0%", blsGrowth: 5, blsDir: "Growing", icon: "ChefHat",
    atRisk: [],
    protected: ["Menu planning", "Food preparation", "Kitchen management"],
    insight: "Creative and social aspects of the job make it less susceptible to AI",
    bls: "5% (As fast as average)",
    evidence: "No evidence of AI displacement",
    protection: "Human interaction and creativity",
  },
  {
    slug: "electrician", title: "Electrician", score: 6, level: "Minimal", category: "Skilled Trades", coverage: "Near 0%", blsGrowth: 11, blsDir: "Growing", icon: "Zap",
    atRisk: [],
    protected: ["Installation", "Maintenance", "Repair"],
    insight: "Electricians' work requires physical presence and adaptability, making AI substitution unlikely",
    bls: "11%",
    evidence: "None",
    protection: "Hands-on skills and site-specific knowledge",
  },
  {
    slug: "plumber", title: "Plumber", score: 5, level: "Minimal", category: "Skilled Trades", coverage: "Near 0%", blsGrowth: 0, blsDir: "Growing", icon: "Wrench",
    atRisk: [],
    protected: ["Installation", "Repair", "Maintenance"],
    insight: "Plumbers require hands-on skills and physical presence, making AI automation less likely",
    bls: "Faster than average",
    evidence: "None",
    protection: "Physical nature of work",
  },
  {
    slug: "firefighter", title: "Firefighter", score: 5, level: "Minimal", category: "Service", coverage: "Physical tasks and emergency response are less likely to be automated", blsGrowth: 9, blsDir: "Growing", icon: "Flame",
    atRisk: [],
    protected: ["Emergency response", "Search and rescue", "Fire suppression"],
    insight: "Firefighting requires a high level of physical fitness, human interaction, and complex decision-making, making it less susceptible to AI automation",
    bls: "9% growth from 2024 to 2034",
    evidence: "No evidence of job displacement due to AI",
    protection: "Human interaction and physical tasks",
  },
  {
    slug: "bartender", title: "Bartender", score: 0, level: "Minimal", category: "Food and Beverage Service", coverage: "Near 0%", blsGrowth: 10, blsDir: "Growing", icon: "Wine",
    atRisk: [],
    protected: ["Customer service", "Drink preparation", "Cash handling"],
    insight: "Bartenders rely heavily on social skills, empathy, and adaptability, making them less vulnerable to AI replacement",
    bls: "10% (Faster than average)",
    evidence: "No evidence of job displacement due to AI",
    protection: "Human interaction and emotional intelligence",
  },
  {
    slug: "lifeguard", title: "Lifeguard", score: 0, level: "Minimal", category: "Service", coverage: "Near 0%", blsGrowth: 10, blsDir: "Growing", icon: "Waves",
    atRisk: [],
    protected: ["Rescue operations", "First aid administration", "Swimming pool maintenance"],
    insight: "Lifeguards require human judgment and physical skills, making AI exposure minimal",
    bls: "10% growth from 2024 to 2034",
    evidence: "No evidence of AI displacement",
    protection: "Human interaction and physical presence",
  },
  {
    slug: "motorcycle-mechanic", title: "Motorcycle Mechanic", score: 5, level: "Minimal", category: "Installation, Maintenance, and Repair", coverage: "Near 0%", blsGrowth: 11, blsDir: "Growing", icon: "Bike",
    atRisk: [],
    protected: ["Diagnosing complex mechanical issues", "Performing custom motorcycle modifications"],
    insight: "Motorcycle mechanics require hands-on skills and direct interaction with vehicles, making AI automation less likely",
    bls: "11% (Faster than average)",
    evidence: "No evidence of AI displacement in this occupation",
    protection: "Physical dexterity and problem-solving skills",
  },
  {
    slug: "agricultural-worker", title: "Agricultural Worker", score: 0, level: "Minimal", category: "Farming, Fishing, and Forestry", coverage: "near 0%", blsGrowth: 5, blsDir: "Flat", icon: "Wheat",
    atRisk: [],
    protected: ["Crop monitoring", "Livestock care", "Equipment operation"],
    insight: "Agricultural workers are less likely to be affected by AI due to the hands-on nature of their work",
    bls: "5% (Slower than average)",
    evidence: "No significant displacement expected",
    protection: "Physical labor and outdoor work",
  },
  {
    slug: "massage-therapist", title: "Massage Therapist", score: 0, level: "Minimal", category: "Healthcare", coverage: "near 0%", blsGrowth: 19, blsDir: "Increasing", icon: "HeartHandshake",
    atRisk: [],
    protected: ["Manual therapy techniques", "Client assessment and consultation"],
    insight: "Massage therapy requires a high level of human touch and empathy, making it less susceptible to AI automation",
    bls: "19% growth from 2024 to 2034",
    evidence: "No evidence of job displacement due to AI",
    protection: "Hands-on, high-touch nature of the job",
  },
];


const LEVELS = {
  "Very High": { color: "#C4614A", label: "CRITICAL RISK", bg: "rgba(196, 97, 74, 0.1)" },
  "High": { color: "#D4943A", label: "HIGH RISK", bg: "rgba(212, 148, 58, 0.1)" },
  "Moderate": { color: "#C49A4A", label: "MODERATE EXPOSURE", bg: "rgba(196, 154, 74, 0.1)" },
  "Low": { color: "#5B9E78", label: "LOW RISK", bg: "rgba(91, 158, 120, 0.1)" },
  "Minimal": { color: "#6B9FD4", label: "SECURE", bg: "rgba(107, 159, 212, 0.1)" },
};
const BLS_C = { "Declining": "#C4614A", "Flat": "#A5B0BA", "Growing": "#5B9E78", "Strong Growth": "#7DC49A" };

export async function getStaticPaths() {
  return {
    paths: JOB_DATA.map(j => ({ params: { slug: j.slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const job = JOB_DATA.find(j => j.slug === params.slug) || null;
  if (!job) return { notFound: true };
  return { props: { job } };
}

export default function JobPage({ job }) {
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState("en");
  const [userCountry, setUserCountry] = useState(null);
  const t = useT(lang);

  // Sync theme + language with main app via localStorage
  useEffect(() => {
    try {
      const savedDark = localStorage.getItem("ai_future_dark");
      if (savedDark !== null) setDark(savedDark === "true");
      const savedLang = localStorage.getItem("ai_future_lang");
      if (savedLang && SUPPORTED_LANGS.includes(savedLang)) setLang(savedLang);
    } catch { }

    // Fetch region
    fetch("/api/region")
      .then(res => res.json())
      .then(data => setUserCountry(data.country))
      .catch(e => console.error("Failed to fetch user country:", e));
  }, []);

  const toggleTheme = () => setDark(d => {
    const next = !d;
    try { localStorage.setItem("ai_future_dark", String(next)); } catch { }
    return next;
  });

  const changeLang = (l) => {
    setLang(l);
    try { localStorage.setItem("ai_future_lang", l); } catch { }
  };

  const lv = LEVELS[job.level];
  const blsC = BLS_C[job.blsDir] || "#8A9BB5";
  const title = `Will AI Replace ${job.title}s? Risk Score ${job.score}/100 | AI Future`;
  const description = `${job.title} AI exposure score: ${job.score}/100 (${job.level} risk). ${job.coverage} of tasks can be handled by AI. BLS employment outlook: ${job.blsDir} through 2034. Based on Anthropic's 2026 labor market research.`;
  const canonical = `${SITE_URL}/jobs/${job.slug}`;

  const bg = dark ? "#0B0F14" : "#F8F6F0";
  const surface = dark ? "#11151B" : "#FFFFFF";
  const surface2 = dark ? "#191E27" : "#F0EAD6";
  const border = dark ? "rgba(240, 234, 214, 0.08)" : "rgba(11, 15, 20, 0.1)";
  const textPrimary = dark ? "#F0EAD6" : "#0B0F14";
  const textSec = dark ? "#A5B0BA" : "#45505C";
  const textMuted = dark ? "#63707D" : "#7B8794";
  const accent = dark ? "#C49A4A" : "#A67B27";

  const jobSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question", name: `Will AI replace ${job.title}s?`,
        acceptedAnswer: { "@type": "Answer", text: `${job.title}s have an AI exposure score of ${job.score}/100 (${job.level} risk). Approximately ${job.coverage} of their core tasks can be handled or assisted by AI, based on Anthropic's 2026 labor market research.` }
      },
      {
        "@type": "Question", name: `What tasks are most at risk for ${job.title}s?`,
        acceptedAnswer: { "@type": "Answer", text: job.atRisk.join(", ") }
      },
      {
        "@type": "Question", name: `What protects ${job.title}s from AI displacement?`,
        acceptedAnswer: { "@type": "Answer", text: job.protected.join(", ") }
      },
      {
        "@type": "Question", name: `What is the BLS employment outlook for ${job.title}s?`,
        acceptedAnswer: { "@type": "Answer", text: job.bls }
      },
    ],
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Leaderboard", item: `${SITE_URL}/#leaderboard` },
      { "@type": "ListItem", position: 3, name: job.title, item: canonical },
    ],
  };

  // Arc gauge calculation
  const R = 68, cx = 88, cy = 88, total = 2 * Math.PI * R, arc = total * 0.75, filled = (job.score / 100) * arc;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />
        <meta name="keywords" content={`will AI replace ${job.title.toLowerCase()}, ${job.title.toLowerCase()} AI risk, ${job.title.toLowerCase()} automation, AI job displacement ${job.title.toLowerCase()}, future of ${job.title.toLowerCase()} jobs`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Fonts are now optimally handled via next/font/google in _app.js */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobSchema).replace(/</g, "\\u003c") }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb).replace(/</g, "\\u003c") }} />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html { scroll-behavior: smooth; font-size: 16px; }
          body { background: ${bg}; color: ${textPrimary}; font-family: var(--font-sora); transition: background 0.3s; line-height: 1.6; }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: ${surface}; }
          ::-webkit-scrollbar-thumb { background: ${border}; border-radius: 3px; }
          @keyframes slideUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
          @keyframes shimmer { from { background-position:-200% 0; } to { background-position:200% 0; } }
          .card { background: ${surface}; border: 1px solid ${border}; border-radius: 20px; padding: clamp(20px, 4vw, 32px); }
          .btn-primary { display:inline-block; background:${accent}; color:white; font-family:var(--font-pf); font-weight:700; font-size:clamp(14px,1.8vw,17px); padding:clamp(11px,2vw,15px) clamp(22px,3vw,32px); border-radius:12px; border:none; cursor:pointer; text-decoration:none; transition:transform 0.15s,box-shadow 0.15s; }
          .btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(79,142,247,0.35); }
          .tag { font-family:var(--font-jb); font-size:clamp(9px,1vw,11px); letter-spacing:0.12em; padding:4px 12px; border-radius:5px; }
          .stat-label { font-family:var(--font-jb); font-size:clamp(8px,0.9vw,10px); letter-spacing:0.12em; color:${textMuted}; margin-bottom:5px; }
          .stat-val   { font-family:var(--font-jb); font-size:clamp(12px,1.4vw,15px); font-weight:600; }
          .body-text  { font-family:var(--font-sora); font-size:clamp(14px,1.6vw,16px); line-height:1.8; }
          .section-label { font-family:var(--font-jb); font-size:clamp(8px,0.9vw,10px); letter-spacing:0.14em; }
          .chip-job { display:inline-flex; align-items:center; gap:6px; padding:clamp(6px,1vw,9px) clamp(12px,1.5vw,18px); background:${surface2}; border:1px solid ${border}; border-radius:24px; text-decoration:none; font-family:var(--font-sora); font-size:clamp(12px,1.3vw,14px); color:${textSec}; transition:all 0.15s; }
          .chip-job:hover { border-color:${accent}; color:${accent}; }
          /* ─── Responsive grid & layout ─── */
          .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:clamp(12px,2vw,20px); }
          .hero-row { display:flex; gap:clamp(20px,3vw,36px); align-items:flex-start; }
          .gauge-wrap { width:clamp(140px,20vw,200px); height:clamp(140px,20vw,200px); flex-shrink:0; }
          .jobs-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(clamp(140px,25vw,200px),1fr)); gap:clamp(6px,1vw,10px); }
          /* Tablet */
          @media (max-width: 768px) {
            .card { padding: 20px; border-radius:16px; }
            .grid-2 { grid-template-columns: 1fr 1fr; gap: 12px; }
          }
          /* Mobile */
          @media (max-width: 600px) {
            .hero-row { flex-direction: column !important; align-items:stretch; }
            .gauge-wrap { width: 140px !important; height: 140px !important; align-self: center; }
            .grid-2 { grid-template-columns: 1fr !important; gap: 10px; }
            .jobs-grid { grid-template-columns: 1fr 1fr; }
          }
          @media (max-width: 400px) {
            .jobs-grid { grid-template-columns: 1fr; }
          }
        `}</style>
      </Head>

      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: `${dark ? "rgba(11, 15, 20, 0.92)" : "rgba(248, 246, 240, 0.92)"}`, backdropFilter: "blur(20px)", borderBottom: `1px solid ${border}`, padding: "0 clamp(16px, 4vw, 32px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/icon.png" width={32} height={32} alt="AI Future Logo" style={{ borderRadius: 8 }} />
            <div>
              <div style={{ fontFamily: "var(--font-pf)", fontWeight: 800, fontSize: 15, color: textPrimary, lineHeight: 1.1 }}>AI Future</div>
              <div style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: textMuted, letterSpacing: "0.1em" }}>RESEARCH-BACKED RISK SCORES</div>
            </div>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/" style={{ fontFamily: "var(--font-sora)", fontSize: 13, color: textSec, textDecoration: "none", padding: "6px 12px", borderRadius: 8, border: `1px solid ${border}` }}>{t.job_back}</Link>

            {/* Language selector */}
            <div style={{ position: "relative" }}>
              <select
                value={lang}
                onChange={e => changeLang(e.target.value)}
                title="Change language"
                style={{
                  background: surface2, border: `1px solid ${border}`, borderRadius: 8,
                  padding: "7px 10px", cursor: "pointer", color: textSec,
                  fontFamily: "var(--font-sora)", fontSize: 13,
                  transition: "all 0.2s", appearance: "none", WebkitAppearance: "none",
                  paddingRight: 28
                }}
              >
                {SUPPORTED_LANGS.map(l => (
                  <option key={l} value={l}>{LANG_META[l].flag} {LANG_META[l].nativeName}</option>
                ))}
              </select>
              <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: textMuted, fontSize: 12 }}>▾</span>
            </div>

            <button
              onClick={toggleTheme}
              title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              style={{ background: surface2, border: `1px solid ${border}`, borderRadius: 8, padding: "7px 10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: textSec, transition: "all 0.2s" }}
            >
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(28px,4vw,48px) clamp(16px,4vw,40px) clamp(60px,8vw,100px)" }}>
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ marginBottom: 28 }}>
          <ol style={{ display: "flex", gap: 8, listStyle: "none", fontFamily: "var(--font-jb)", fontSize: "clamp(10px,1.1vw,12px)", color: textMuted, flexWrap: "wrap" }}>
            <li><Link href="/" style={{ color: accent, textDecoration: "none" }}>{t.job_breadcrumb_home}</Link></li>
            <li style={{ opacity: 0.4 }}>/</li>
            <li><Link href="/#leaderboard" style={{ color: textSec, textDecoration: "none" }}>{t.job_breadcrumb_leaderboard}</Link></li>
            <li style={{ opacity: 0.4 }}>/</li>
            <li style={{ color: textMuted }}>{job.title}</li>
          </ol>
        </nav>

        {/* Hero card */}
        <div style={{ background: surface, border: `1px solid ${lv.color}30`, borderRadius: 20, overflow: "hidden", boxShadow: `0 0 40px ${lv.bg}`, marginBottom: 24, animation: "slideUp 0.4s both" }}>
          <div style={{ height: 3, background: `linear-gradient(90deg,${lv.color},${lv.color}44)` }} />
          <div style={{ padding: "clamp(20px,3vw,36px)" }}>
            {/* Badges */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              <span className="tag" style={{ background: `${lv.color}12`, border: `1px solid ${lv.color}30`, color: lv.color }}>{lv.label} RISK</span>
              <span className="tag" style={{ background: `${blsC}12`, border: `1px solid ${blsC}30`, color: blsC }}>BLS: {job.blsDir}</span>
              <span className="tag" style={{ background: `${accent}12`, border: `1px solid ${accent}30`, color: accent }}>{t.job_badge_research}</span>
            </div>

            {/* Hero row */}
            <div className="hero-row">
              {/* Gauge SVG */}
              <div className="gauge-wrap" style={{ position: "relative" }}>
                <svg width="100%" height="100%" viewBox="0 0 176 176">
                  <defs>
                    <linearGradient id="gfill" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={lv.color} stopOpacity={0.6} />
                      <stop offset="100%" stopColor={lv.color} />
                    </linearGradient>
                  </defs>
                  <circle cx={cx} cy={cy} r={R} fill="none" stroke={surface2} strokeWidth={10}
                    strokeDasharray={`${arc} ${total - arc}`} strokeDashoffset={total * 0.125} strokeLinecap="round"
                    style={{ transform: `rotate(135deg)`, transformOrigin: `${cx}px ${cy}px` }} />
                  <circle cx={cx} cy={cy} r={R} fill="none" stroke="url(#gfill)" strokeWidth={10}
                    strokeDasharray={`${filled} ${total - filled}`} strokeDashoffset={total * 0.125} strokeLinecap="round"
                    style={{ transform: `rotate(135deg)`, transformOrigin: `${cx}px ${cy}px` }} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <span style={{ fontFamily: "var(--font-pf)", fontSize: "clamp(36px,6vw,56px)", fontWeight: 900, lineHeight: 1, color: lv.color, letterSpacing: "-2px" }}>{job.score}</span>
                  <span style={{ fontFamily: "var(--font-jb)", fontSize: "clamp(9px,1vw,11px)", color: textMuted, letterSpacing: "0.12em" }}>/ 100</span>
                  <span className="tag" style={{ background: `${lv.color}14`, border: `1px solid ${lv.color}30`, color: lv.color, marginTop: 4 }}>{lv.label}</span>
                </div>
              </div>

              {/* Meta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="section-label" style={{ color: textMuted, letterSpacing: "0.15em", marginBottom: 10 }}>{t.job_label_analysis}</div>
                <h1 style={{ fontFamily: "var(--font-pf)", fontWeight: 900, fontSize: "clamp(26px,4.5vw,48px)", color: textPrimary, letterSpacing: "-0.5px", marginBottom: 14, lineHeight: 1.1, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  {(() => { const Icon = Icons[job.icon]; return Icon ? <Icon size={"clamp(26px,3.5vw,40px)"} color={textPrimary} style={{ verticalAlign: "middle", flexShrink: 0 }} /> : null; })()} {job.title}
                </h1>
                {/* Stats grid */}
                <div className="grid-2" style={{ marginBottom: 20 }}>
                  {[
                    { label: "TASK COVERAGE", val: job.coverage, color: lv.color },
                    { label: "EMPLOYMENT TREND", val: job.blsDir, color: blsC },
                    { label: "BLS GROWTH RATE", val: `${job.blsGrowth > 0 ? "+" : ""}${job.blsGrowth}%`, color: blsC },
                    { label: "CATEGORY", val: job.category, color: textSec },
                  ].map((s, i) => (
                    <div key={i} style={{ background: surface2, border: `1px solid ${border}`, borderRadius: 12, padding: "clamp(10px,1.5vw,16px) clamp(12px,1.8vw,18px)" }}>
                      <div className="stat-label">{s.label}</div>
                      <div className="stat-val" style={{ color: s.color }}>{s.val}</div>
                    </div>
                  ))}
                </div>
                {/* CTA */}
                <Link href={`/?q=${encodeURIComponent(job.title)}`} className="btn-primary">
                  {t.job_cta}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks grid */}
        <div className="grid-2" style={{ marginBottom: 20 }}>
          {[
            { label: t.job_at_risk, accent: "#F04B6B", icon: <AlertTriangle size={18} />, items: job.atRisk },
            { label: t.job_protected, accent: "#30C47E", icon: <Check size={18} />, items: job.protected },
          ].map(col => (
            <div key={col.label} className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ width: 26, height: 26, borderRadius: 7, background: `${col.accent}12`, border: `1px solid ${col.accent}25`, display: "inline-flex", alignItems: "center", justifyContent: "center", color: col.accent, flexShrink: 0 }}>{col.icon}</span>
                <span className="section-label" style={{ color: col.accent }}>{col.label}</span>
              </div>
              <ul style={{ listStyle: "none" }}>
                {col.items.map((task, i) => (
                  <li key={i} className="body-text" style={{ display: "flex", gap: 10, color: textSec, alignItems: "flex-start", marginBottom: 10 }}>
                    <span style={{ color: `${col.accent}60`, flexShrink: 0, marginTop: 4, fontSize: 11 }}>◆</span>{task}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Insight + BLS */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}><Radio size={13} /><span className="section-label" style={{ color: textMuted }}>{t.job_insight_label}</span></div>
          <p className="body-text" style={{ color: textSec, marginBottom: 20 }}>{job.insight}</p>
          <div className="grid-2" style={{ borderTop: `1px solid ${border}`, paddingTop: 20 }}>
            <div>
              <div className="stat-label" style={{ marginBottom: 8 }}>{t.job_bls_label}</div>
              <div className="body-text" style={{ color: blsC }}>{job.bls}</div>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}><BookOpen size={11} /><span className="stat-label">{t.job_evidence_label}</span></div>
              <div className="body-text" style={{ color: textSec }}>{job.evidence}</div>
            </div>
          </div>
        </div>

        {/* DocSet CTA */}
        <div style={{ marginBottom: 24 }}>
          <DocSetCTA
            th={{ surface, surface2, border, accent, textPrimary, textSecondary: textSec, textMuted, bg, cardShadow: `0 10px 40px ${border}` }}
            isIndian={userCountry === "IN" || userCountry === "IND"}
          />
        </div>

        {/* Other jobs */}
        <div className="card">
          <div className="section-label" style={{ color: textMuted, marginBottom: 18 }}>{t.job_explore}</div>
          <div className="jobs-grid">
            {JOB_DATA.filter(j => j.slug !== job.slug).slice(0, 8).map(j => {
              const jlv = LEVELS[j.level];
              return (
                <Link key={j.slug} href={`/jobs/${j.slug}`} className="chip-job">
                  {(() => { const Icon = Icons[j.icon]; return Icon ? <Icon size={16} /> : null; })()} {j.title}
                  <span style={{ fontFamily: "var(--font-jb)", fontSize: "clamp(9px,1vw,11px)", color: jlv.color, marginLeft: "auto" }}>{j.score}</span>
                </Link>
              );
            })}
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "clamp(7px,1vw,10px) clamp(14px,1.5vw,18px)", background: `${accent}12`, border: `1px solid ${accent}30`, borderRadius: 24, textDecoration: "none", fontFamily: "var(--font-sora)", fontSize: "clamp(12px,1.3vw,14px)", color: accent }}>
              {t.job_view_all}
            </Link>
          </div>
        </div>
      </main>

      <footer style={{ borderTop: `1px solid ${border}`, padding: "clamp(20px,3vw,32px) clamp(16px,4vw,40px)", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-jb)", fontSize: "clamp(10px,1.1vw,12px)", color: textMuted }}>
          {t.job_footer} ·{" "}
          <a href="https://www.anthropic.com/research/labor-market-impacts" target="_blank" rel="noopener noreferrer" style={{ color: accent, textDecoration: "none" }}>anthropic.com</a>
          {" "}· © 2026
        </div>
      </footer>
    </>
  );
}
