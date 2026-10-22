import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, BadgeCheck, BookmarkCheck, CircleCheck, FileVideo2, ListFilter, Search, ShieldCheck, UserRoundPlus, UsersRound } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { HomeDashboard } from "@/components/home-dashboard";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) return <HomeDashboard user={user} />;
  return <main>
    <section className="hero-shell">
      <div className="hero-copy">
        <p className="eyebrow"><span className="eyebrow-dot" /> Work, with the people in view</p>
        <h1>Let your work<br /><em>speak for you.</em></h1>
        <p className="hero-description">A better introduction to the work you do. Find clear opportunities, share a short video with your application, and follow every recorded next step.</p>
        <form className="hero-search" action="/jobs">
          <label className="search-field"><Search size={19} /><span className="visually-hidden">Job title or skill</span><input name="query" placeholder="Job title or skill" /></label>
          <label className="search-field location-field"><span className="visually-hidden">Location</span><input name="location" placeholder="Where? Remote or a city" /></label>
          <button className="button button-accent" type="submit">Find work <ArrowRight size={17} /></button>
        </form>
        <div className="hero-actions"><Link className="button button-dark button-small" href="/register">Sign up free <ArrowUpRight size={15} /></Link><Link className="text-link" href="/register?role=employer">I’m hiring <ArrowUpRight size={15} /></Link></div>
      </div>
      <div className="hero-visual">
        <img className="hero-photo" src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=85" alt="Colleagues sharing ideas around a laptop" />
        <div className="hero-photo-overlay" />
        <div className="hero-photo-caption"><span>Good work is a conversation.</span><strong>Make yours easier to start.</strong></div>
        <div className="intro-preview"><span className="intro-icon"><FileVideo2 size={17} /></span><span><b>A human introduction</b><small>Optional with every application</small></span><span className="intro-duration">00:45</span></div>
      </div>
      <a className="scroll-cue" href="#opportunities" aria-label="Explore opportunities"><ArrowDownRight size={17} /> Scroll to explore</a>
    </section>

    <section className="feature-section section-wrap" aria-labelledby="features-heading">
      <div className="section-heading"><div><p className="eyebrow">A more human way to move forward</p><h2 id="features-heading">The useful parts, without the noise.</h2></div><p className="feature-intro">Built around real roles, honest signals, and a little more room to show who you are.</p></div>
      <div className="feature-grid">
        <article className="feature-item"><span className="feature-icon"><FileVideo2 size={19} /></span><p className="feature-kicker">01 / SHOW YOURSELF</p><h3>Say hello on video</h3><p>Attach an optional short introduction to an application. Only you and that role’s employer can view it.</p></article>
        <article className="feature-item"><span className="feature-icon"><ListFilter size={19} /></span><p className="feature-kicker">02 / FIND YOUR FIT</p><h3>Start with the work</h3><p>Search roles by title, skills, or place. See the stated requirements, arrangement, and salary when provided.</p></article>
        <article className="feature-item"><span className="feature-icon"><BookmarkCheck size={19} /></span><p className="feature-kicker">03 / KEEP YOUR SHORTLIST</p><h3>Save the ones worth a look</h3><p>Keep interesting roles together in your workspace and return when you’re ready.</p></article>
        <article className="feature-item"><span className="feature-icon"><CircleCheck size={19} /></span><p className="feature-kicker">04 / KNOW WHAT HAPPENED</p><h3>Follow every update</h3><p>Get a receipt and see employer-recorded application changes in one clear timeline.</p></article>
        <article className="feature-item"><span className="feature-icon"><UserRoundPlus size={19} /></span><p className="feature-kicker">05 / BUILD YOUR PROFILE</p><h3>Show your path</h3><p>Add your experience, education, skills, and work links. Choose whether other members can find you.</p></article>
        <article className="feature-item"><span className="feature-icon"><UsersRound size={19} /></span><p className="feature-kicker">06 / CONNECT WITH CARE</p><h3>Build real connections</h3><p>Send connection requests and message accepted connections directly, without a public engagement feed.</p></article>
      </div>
    </section>

    <section className="people-section" aria-labelledby="people-heading">
      <div className="section-wrap">
        <div className="people-heading"><div><p className="eyebrow">People first, always</p><h2 id="people-heading">A better view of the people behind the work.</h2></div><p>Less performing for an algorithm. More context for the person making the decision.</p></div>
        <div className="people-grid">
          <article className="people-tile"><img src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=85" alt="A small team collaborating over a project" /><div><span>FOR CANDIDATES</span><h3>Bring your work into focus.</h3></div></article>
          <article className="people-tile"><img src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=85" alt="Hiring colleagues discussing an application together" /><div><span>FOR EMPLOYERS</span><h3>Meet the person, not just the PDF.</h3></div></article>
          <article className="people-tile"><img src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85" alt="A professional recording a short introduction" /><div><span>YOUR STORY, YOUR CALL</span><h3>Share only what feels right.</h3></div></article>
        </div>
        <p className="image-disclosure">Photography illustrates how people may use Olyvara; pictured people are not represented as customers.</p>
      </div>
    </section>

    <section className="opportunities section-wrap" id="opportunities">
      <div className="section-heading"><div><p className="eyebrow">The opportunity board</p><h2>Work worth a closer look.</h2></div><Link className="text-link" href="/jobs">Explore all jobs <ArrowUpRight size={16} /></Link></div>
      <div className="empty-state signup-gate"><h3>Open roles are part of your Olyvara workspace.</h3><p>Create a free account to search, save, and apply to opportunities, then track real status updates.</p><Link className="button button-primary" href="/register">Sign up to explore jobs <ArrowUpRight size={15} /></Link></div>
      <p className="demo-disclosure">Fictional demo vacancies are labeled. Employer verification is shown separately and is not a guarantee about any vacancy.</p>
    </section>

    <section className="process-band" id="how-it-works"><div className="section-wrap process-inner"><div className="process-intro"><p className="eyebrow">Less guesswork, both sides</p><h2>A hiring process<br />you can actually follow.</h2><p>Good hiring is a series of clear decisions, not a black box. Olyvara keeps the important parts connected.</p><Link className="button button-light" href="/register">Build your profile <ArrowRight size={17} /></Link></div><div className="process-steps"><div className="process-step"><span>01</span><div><h3>Show what you can do</h3><p>Bring skills and real experience together in a profile you control.</p></div></div><div className="process-step"><span>02</span><div><h3>Know what a role asks</h3><p>See essential requirements, preferences, location, and what is known about the listing.</p></div></div><div className="process-step"><span>03</span><div><h3>Follow every application</h3><p>Get a receipt, see recorded status changes, and keep your search organized.</p></div></div></div></div></section>

    <section className="employer-band section-wrap" id="for-employers"><div><p className="eyebrow">For hiring teams</p><h2>Hire for the work.<br /><em>See the evidence.</em></h2></div><div className="employer-copy"><p>Define the work clearly. Keep applications in one place. Record decisions and give candidates a process they can follow.</p><Link className="text-link" href="/register?role=employer">Create an employer account <ArrowUpRight size={16} /></Link><p className="honesty-note"><ShieldCheck size={17} /> New organizations begin unverified. A badge reflects a recorded review, not a promise about every role.</p></div></section>

    <footer className="site-footer"><Link className="brand footer-brand" href="/" aria-label="Olyvara home"><img className="brand-symbol" src="/olyvara-mark.svg" alt="" /><span>Olyvara</span></Link><p>A hiring network built around real work and clear steps.</p><div><Link href="/jobs">Find work</Link><Link href="/register">Join Olyvara</Link><Link href="/privacy">Privacy</Link><Link href="/cookies">Cookies</Link><a href="mailto:support@olyvara.example">Contact</a></div><small>Local demo build · fictional listings are marked · policies require review before public launch.</small></footer>
  </main>;
}