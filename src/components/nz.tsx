import { colors } from '../styles/tokens';
import { editorialStyles } from '../styles/editorialStyles';

function NewZealandVideo() {
  return (
    <div style={{ ...editorialStyles.pageContainer, paddingBottom: 80 }}>
      <div style={editorialStyles.eyebrow}>Feature</div>
      <h2 style={editorialStyles.gameTitle}>NZ</h2>
      <p style={editorialStyles.dek}>
        The New Zealand feature presentation.
      </p>
      <div
        style={{
          marginTop: 28,
          border: `1px solid ${colors.ink}`,
          width: '100%',
          aspectRatio: '16 / 9',
          backgroundColor: colors.ink,
        }}
      >
        <iframe
          src="https://player.vimeo.com/video/1090882752"
          allow="autoplay; fullscreen; picture-in-picture"
          style={{
            border: 'none',
            width: '100%',
            height: '100%',
            display: 'block',
          }}
          allowFullScreen
          title="New Zealand Video"
        />
      </div>
    </div>
  );
}

export default NewZealandVideo;
