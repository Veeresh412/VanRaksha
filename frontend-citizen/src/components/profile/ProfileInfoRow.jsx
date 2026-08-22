import './ProfileSection.css';

export default function ProfileInfoRow({ label, value }) {
  return (
    <div className="profile-section__row">
      <span className="profile-section__label">{label}</span>
      <span className="profile-section__value">{value}</span>
    </div>
  );
}
