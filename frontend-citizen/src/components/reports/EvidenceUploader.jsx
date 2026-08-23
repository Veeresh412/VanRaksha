import { useRef } from 'react';
import { Camera, Video, X, FileVideo } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import './EvidenceUploader.css';

export default function EvidenceUploader({ photos, videos, onPhotosChange, onVideosChange }) {
  const { t } = useTranslation();
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const handlePhotoSelect = (event) => {
    const files = Array.from(event.target.files || []);
    const newPhotos = files.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      name: file.name,
      file,
      preview: URL.createObjectURL(file),
    }));

    onPhotosChange([...photos, ...newPhotos]);
    event.target.value = '';
  };

  const handleVideoSelect = (event) => {
    const files = Array.from(event.target.files || []);
    const newVideos = files.map((file) => ({
      id: `${file.name}-${Date.now()}`,
      name: file.name,
      file,
      preview: URL.createObjectURL(file),
    }));
    onVideosChange([...videos, ...newVideos]);
    event.target.value = '';
  };

  const removePhoto = (id) => {
    onPhotosChange(photos.filter((photo) => photo.id !== id));
  };

  const removeVideo = (id) => {
    onVideosChange(videos.filter((video) => video.id !== id));
  };

  return (
    <div className="evidence-uploader">
      <div className="evidence-uploader__grid">
        <label className="evidence-uploader__box">
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handlePhotoSelect}
          />
          <Camera size={24} className="evidence-uploader__icon" />
          <span className="evidence-uploader__label">{t('report.addPhoto')}</span>
        </label>

        <label className="evidence-uploader__box">
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            capture="environment"
            multiple
            onChange={handleVideoSelect}
          />
          <Video size={24} className="evidence-uploader__icon" />
          <span className="evidence-uploader__label">{t('report.addVideo')}</span>
        </label>
      </div>

      {(photos.length > 0 || videos.length > 0) && (
        <div className="evidence-uploader__files">
          {photos.map((photo) => (
            <div key={photo.id} className="evidence-uploader__file">
              <div className="evidence-uploader__thumb">
                {photo.preview ? (
                  <img src={photo.preview} alt={photo.name} />
                ) : (
                  <Camera size={20} />
                )}
              </div>
              <div className="evidence-uploader__meta">
                <span className="evidence-uploader__name">{photo.name}</span>
                <span className="evidence-uploader__status">{t('common.selected')}</span>
              </div>
              <button
                type="button"
                className="evidence-uploader__remove"
                onClick={() => removePhoto(photo.id)}
                aria-label={t('common.removeFile', { name: photo.name })}
              >
                <X size={18} />
              </button>
            </div>
          ))}
          {videos.map((video) => (
            <div key={video.id} className="evidence-uploader__file">
              <div className="evidence-uploader__thumb">
                <FileVideo size={20} />
              </div>
              <div className="evidence-uploader__meta">
                <span className="evidence-uploader__name">{video.name}</span>
                <span className="evidence-uploader__status">{t('common.selected')}</span>
              </div>
              <button
                type="button"
                className="evidence-uploader__remove"
                onClick={() => removeVideo(video.id)}
                aria-label={t('common.removeFile', { name: video.name })}
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
