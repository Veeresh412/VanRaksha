import './ProfileSection.css';

export default function ProfileSection({ title, children }) {
  return (
    <section className="profile-section">
      <h3 className="profile-section__title">{title}</h3>
      <div className="profile-section__card">{children}</div>
    </section>
  );
}
