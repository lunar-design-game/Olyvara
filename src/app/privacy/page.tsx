import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

type PolicyBlock = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

const sections: PolicyBlock[] = [
  {
    title: "1. Introduction",
    paragraphs: [
      "Welcome to Olyvara.",
      "Olyvara is a hiring platform designed to help job seekers discover opportunities, present their skills, submit applications, and track recruitment progress. It also helps employers publish job openings, review applications, evaluate candidates, and manage hiring activities.",
      "This Privacy Policy explains how Olyvara collects, uses, stores, shares, and protects personal information when you visit our website, create an account, submit an application, publish a vacancy, or use our services.",
      "We are committed to handling personal information responsibly, transparently, and for legitimate purposes.",
      "Platform operator: [Insert the legal name of the person or organization operating Olyvara]",
      "Privacy contact: [Insert a monitored privacy email address]",
      "Business address: [Insert official business address, where applicable]",
      "Website: [Insert Olyvara's official website URL]",
      "These details must be completed before publication.",
    ],
  },
  {
    title: "2. Information We Collect",
    paragraphs: ["The information we collect depends on your account type, the features you use, and the information you choose to provide."],
    bullets: [],
  },
  {
    title: "2.1 Account Information",
    paragraphs: ["When you create an account, we may collect your name, email address, account identifier, authentication information, and account preferences.", "We use this information to create and maintain your account, verify access where appropriate, provide requested services, and protect account security.", "We do not need to collect unnecessary personal information simply to view public informational pages. Access to job search, applications, and other workspace tools requires an account."],
  },
  {
    title: "2.2 Job Seeker Information",
    paragraphs: ["If you create a job seeker profile, you may provide:"],
    bullets: [
      "Name and professional headline.",
      "Professional biography and contact information.",
      "Skills and areas of expertise.",
      "Employment and education history.",
      "Projects and work samples.",
      "Portfolio links and professional achievements.",
      "Certifications and qualifications.",
      "CVs, resumes, and cover letters.",
      "Preferred roles, locations, and working arrangements.",
      "Application answers and supporting documents.",
      "References or other information you choose to provide.",
      "Optional video introductions, if this feature is available.",
      "Other information voluntarily included in your profile or applications.",
      "You should provide only information relevant to your job search and avoid uploading unnecessary sensitive personal documents.",
    ],
  },
  {
    title: "2.3 Employer Information",
    paragraphs: ["Employers and recruiters may provide their names, business email addresses, job titles, organization names, company descriptions, websites, business contact information, and team membership details.", "Where employer verification is offered, we may collect information submitted to support a verification request.", "Access to verification records and supporting documents should be restricted to authorized personnel."],
  },
  {
    title: "2.4 Job Listings and Recruitment Information",
    paragraphs: ["When employers use Olyvara, we may collect job descriptions, job requirements, salaries or salary ranges supplied by employers, application deadlines, recruitment stages, interview details, and other information relevant to hiring.", "We may also record whether a vacancy is awaiting review, published, paused, expired, or closed."],
  },
  {
    title: "2.5 Application Information",
    paragraphs: ["When you apply for a job through Olyvara, we process the information you submit for that application.", "This may include your selected CV, profile information, supporting documents, answers to application questions, relevant project evidence, and communications associated with the recruitment process.", "We may maintain an application history recording events such as submission, acknowledgement, status updates, interview invitations, withdrawal, offers, and recorded hiring decisions."],
  },
  {
    title: "2.6 Communications and Support",
    paragraphs: ["If you contact us, report a suspicious listing, submit a support request, or communicate through the platform, we may process the information necessary to respond and maintain the relevant records.", "This may include messages, report details, timestamps, and associated account information."],
  },
  {
    title: "2.7 Technical Information",
    paragraphs: ["When you access Olyvara, our systems or service providers may process technical information such as browser type, device information, IP address, requested pages, timestamps, and security logs.", "We use this information where necessary to operate the website, diagnose errors, protect accounts, prevent abuse, and maintain service reliability.", "Analytics information will only be collected if the relevant analytics functionality is actually enabled."],
  },
  {
    title: "2.8 Cookies and Similar Technologies",
    paragraphs: ["Olyvara may use essential cookies or comparable browser technologies to maintain sessions, support authentication, protect account security, and remember necessary preferences.", "Optional analytics or advertising technologies, if introduced, will be addressed through the applicable privacy notices and cookie controls.", "Please refer to the separate Cookie Policy for further information."],
  },
  {
    title: "3. How We Use Personal Information",
    paragraphs: ["We may use personal information for the following purposes:"],
    bullets: [
      "Creating and maintaining user accounts.",
      "Managing candidate profiles and professional portfolios.",
      "Displaying, searching, and organizing job opportunities.",
      "Preparing applications using information supplied by candidates.",
      "Sending applications to the relevant employers when candidates submit them.",
      "Helping employers manage vacancies and recruitment workflows.",
      "Comparing job requirements with candidate-provided information.",
      "Managing interviews, application updates, and recruitment communications.",
      "Reviewing employer verification requests and reported listings.",
      "Detecting suspected fraud, impersonation, spam, and unauthorized access.",
      "Sending important service, application, and account-security notifications.",
      "Responding to support requests.",
      "Maintaining and improving website functionality and reliability.",
      "Meeting applicable legal obligations and establishing or defending legal claims where appropriate.",
      "We aim to collect and use only information that is adequate, relevant, and necessary for the stated purpose. We will not deliberately fabricate candidate information or represent unverified qualifications as independently verified.",
    ],
  },
  {
    title: "4. Legal Grounds for Processing",
    paragraphs: ["Where required by applicable law, we process personal information on an appropriate legal basis.", "Depending on the specific activity, this may include:"],
    bullets: [
      "Providing a requested service: Processing necessary to create an account, manage a profile, submit an application, or provide another requested feature.",
      "Consent: Processing for which your informed permission is the appropriate legal basis. Where applicable, you can withdraw consent.",
      "Legal obligations: Processing necessary to meet requirements imposed by applicable law.",
      "Legitimate interests: Processing for appropriate purposes such as protecting account security, preventing fraud, and maintaining reliable services, where permitted by law and where your rights and interests are appropriately considered.",
      "The applicable basis depends on the actual processing activity. We will not treat acceptance of this Privacy Policy as blanket consent to every possible use of personal information.",
    ],
  },
  {
    title: "5. Profile Visibility and Candidate Control",
    paragraphs: ["Olyvara is designed to give job seekers control over how their professional information is shared.", "Depending on available settings, candidates may choose to maintain a private profile, share selected information with an employer, or make specified professional information publicly visible.", "When you submit an application, the information included in that application is shared with the employer responsible for the vacancy and authorized members of its recruitment team.", "Private CVs, supporting documents, messages, and other restricted information must not be exposed publicly without appropriate authorization.", "Candidates should review their profile visibility and the information included in an application before sharing it.", "If you apply through an external employer website, that website's privacy practices also apply to information you submit directly to it."],
  },
  {
    title: "6. How We Share Personal Information",
    paragraphs: ["We may share personal information in the following circumstances."],
  },
  {
    title: "6.1 With Employers",
    paragraphs: ["When you submit an application, we share the relevant application information with the employer receiving it.", "An employer may use that information to assess your application, contact you, arrange interviews, and manage the recruitment process.", "Employers are responsible for their own handling of information received through Olyvara and must comply with the laws applicable to their activities."],
  },
  {
    title: "6.2 With Service Providers",
    paragraphs: ["We may use service providers to operate the website, host databases, authenticate accounts, store files, deliver emails, maintain security, or provide technical support.", "Such providers should process information only as permitted by their assigned responsibilities and applicable agreements.", "The actual providers used by Olyvara must be identified and reviewed before launch. We will not claim that a particular provider is used unless it is configured in the application."],
  },
  {
    title: "6.3 For Security and Legal Reasons",
    paragraphs: ["We may disclose information when reasonably necessary to investigate suspected fraud, protect users, respond to lawful requests, comply with applicable law, or establish, exercise, or defend legal claims."],
  },
  {
    title: "6.4 Business Transfers",
    paragraphs: ["If the business operating Olyvara undergoes a merger, acquisition, restructuring, or transfer of relevant assets, personal information may be involved in that transaction, subject to appropriate safeguards and applicable law."],
  },
  {
    title: "6.5 What We Do Not Guarantee",
    paragraphs: ["Olyvara does not guarantee that every employer is trustworthy, every job listing is genuine, or every employer will use candidate information appropriately after receiving it.", "We will establish appropriate platform rules and safeguards, but users should exercise reasonable caution when sharing sensitive information."],
  },
  {
    title: "7. Job Matching and Automated Processing",
    paragraphs: ["Olyvara may compare candidate information with job requirements to identify potentially relevant opportunities.", "Matching results may be based on information such as skills, experience, stated qualifications, preferred locations, and working arrangements.", "These results are informational and may be incomplete when candidate profiles or job descriptions lack relevant details.", "Missing information must not automatically be interpreted as proof that a candidate lacks a particular skill.", "Olyvara must not represent a match score as a guaranteed probability of being hired.", "Employers remain responsible for their recruitment decisions, and hiring assessments should use appropriate job-related criteria.", "If Olyvara introduces automated processing that materially affects candidates, we will assess the applicable legal requirements and implement appropriate transparency and safeguards before introducing the feature."],
  },
  {
    title: "8. Data Retention",
    paragraphs: ["We retain personal information only for as long as reasonably necessary for the relevant purposes, subject to applicable legal obligations and legitimate retention requirements.", "Retention periods may differ for account details, candidate profiles, CVs, applications, employer verification records, moderation reports, messages, and security logs.", "Where information is no longer required, we will take appropriate steps to delete or anonymize it, subject to lawful retention requirements.", "Olyvara must establish documented retention periods for the actual information it collects before public launch.", "Information stored in backups may remain until it is removed through the applicable backup-retention process."],
  },
  {
    title: "9. Data Security",
    paragraphs: ["We aim to protect personal information through appropriate technical and organizational safeguards.", "Depending on the system implemented, these may include access restrictions, secure authentication, encrypted connections, validation of submitted information, protected file storage, backups, audit logging, and security monitoring.", "Access to candidate applications, private documents, employer records, and internal recruitment notes must be restricted to authorized users.", "No online platform can guarantee absolute security.", "If a personal-data breach occurs, we will investigate and take appropriate action, including notifications to affected individuals or relevant authorities where required by applicable law.", "Users should protect their passwords and report suspected unauthorized access promptly."],
  },
  {
    title: "10. International Data Transfers",
    paragraphs: ["Some services used to operate Olyvara may store or process information outside Kenya.", "Where personal information is transferred internationally, we will assess the applicable legal requirements and implement the necessary safeguards, permissions, or other lawful conditions.", "Before launch, we must establish where production databases, file storage, authentication services, email systems, and backups are located.", "We will not assume that a service complies with Kenyan data-protection requirements simply because it is commercially available."],
  },
  {
    title: "11. Your Privacy Rights",
    paragraphs: ["Subject to applicable law and relevant conditions, you may have rights to:", "To exercise a privacy right, contact:", "Olyvara Privacy Contact: [Insert monitored privacy email address]", "We may request reasonable information to verify your identity before fulfilling a request.", "We will respond within the time required by applicable law and explain when a lawful exception affects a request.", "In Kenya, the Office of the Data Protection Commissioner provides information about data-subject rights and handles relevant complaints."],
    bullets: [
      "Be informed about how your personal information is used.",
      "Request access to your personal information.",
      "Request correction of inaccurate or misleading information.",
      "Request deletion of personal information where applicable.",
      "Object to certain processing activities.",
      "Request restriction of processing where applicable.",
      "Request transfer of personal information where the applicable right exists.",
      "Withdraw consent where processing relies on consent.",
      "Lodge a complaint with the relevant data protection authority.",
    ],
  },
  {
    title: "12. Account Deletion",
    paragraphs: ["You may request the deletion of your Olyvara account through available account settings or by contacting our privacy team.", "We will assess the request and delete or anonymize information that we no longer have a lawful reason to retain.", "Some information may need to be retained to satisfy legal obligations, resolve disputes, investigate abuse, or maintain other legitimate records permitted by law.", "Deleting your Olyvara account cannot automatically delete copies of your application or documents that an employer has already received and independently retained.", "The account-deletion process must explain any applicable retention exceptions clearly."],
  },
  {
    title: "13. Children's Privacy and Eligibility",
    paragraphs: ["Olyvara's initial registered job-seeker and employer marketplace is intended for users aged 18 and above.", "We do not knowingly seek to collect children's personal information through accounts under this initial eligibility policy.", "If we discover an account that violates this policy, we will review the situation and take appropriate action.", "This policy must be updated before Olyvara deliberately offers registered services to younger users."],
  },
  {
    title: "14. Third-Party Websites",
    paragraphs: ["Olyvara may contain links to employer websites, external application portals, or third-party services.", "We do not control the privacy practices of those external websites.", "Before submitting information to a third party, review its privacy policy and ensure that you understand how the information will be used.", "A link to an external service does not automatically mean Olyvara endorses or guarantees that service."],
  },
  {
    title: "15. Changes to This Privacy Policy",
    paragraphs: ["We may update this Privacy Policy when our services, data practices, technology, or legal obligations change.", "We will publish the revised version with an updated date.", "Where required, we will provide additional notice or obtain consent before introducing materially different processing activities.", "We encourage users to review this page periodically."],
  },
  {
    title: "16. Contact Olyvara",
    paragraphs: ["For questions about this Privacy Policy or the handling of your personal information, contact:", "Olyvara Privacy Team", "Legal operator: [Insert legal name]", "Email: [Insert monitored privacy email address]", "Business address: [Insert official address, where applicable]", "Website: [Insert official website URL]", "Please do not include passwords or unnecessary sensitive documents in ordinary support messages."],
  },
];

export default function PrivacyPage() {
  return <main className="page-shell policy-page">
    <header className="page-heading"><p className="eyebrow">Olyvara legal information</p><h1>Privacy Policy</h1><p><strong>Effective date:</strong> [Date of publication] · <strong>Last updated:</strong> 20 October 2026</p></header>
    <div className="policy-notice"><strong>Draft notice</strong><p>The operator, monitored privacy contact, business address, and publication date below must be completed before publication.</p></div>
    {sections.map((section) => <section className="policy-section" key={section.title}><h2>{section.title}</h2>{section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}{section.title === "11. Your Privacy Rights" && <p>Official website: <a href="https://www.odpc.go.ke/" target="_blank" rel="noreferrer">https://www.odpc.go.ke/</a></p>}</section>)}
  </main>;
}