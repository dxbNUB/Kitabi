import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

Font.register({
  family: 'Playfair Display',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/playfairdisplay/v36/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDQ.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/playfairdisplay/v36/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKd3vUDQ.woff2', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  coverPage: {
    backgroundColor: '#1a1a1a',
    padding: 72,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 36,
    color: '#F5A623',
    textAlign: 'center',
    marginBottom: 16,
  },
  coverGenre: {
    fontSize: 11,
    color: '#888',
    letterSpacing: 2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  coverChapterLabel: {
    fontSize: 13,
    color: '#ccc',
    marginTop: 24,
  },
  coverBranding: {
    fontSize: 9,
    color: '#444',
    position: 'absolute',
    bottom: 40,
  },
  page: {
    paddingTop: 72,
    paddingBottom: 72,
    paddingLeft: 90,
    paddingRight: 90,
    backgroundColor: '#FDFAF5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
    paddingBottom: 8,
  },
  headerText: {
    fontSize: 8,
    color: '#888',
    fontFamily: 'Playfair Display',
    fontStyle: 'italic',
  },
  body: {
    fontFamily: 'Playfair Display',
    fontSize: 11.5,
    lineHeight: 1.9,
    color: '#2C2416',
  },
  paragraph: {
    marginBottom: 10,
    textAlign: 'justify',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 90,
    right: 90,
    textAlign: 'center',
    fontSize: 8,
    color: '#888',
  },
  separator: {
    borderTopWidth: 0.5,
    borderTopColor: '#ccc',
    marginTop: 32,
    marginBottom: 14,
  },
  authorNoteTitle: {
    fontSize: 8,
    color: '#888',
    letterSpacing: 1.5,
    fontFamily: 'Playfair Display',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  authorNoteBody: {
    fontSize: 9.5,
    color: '#555',
    lineHeight: 1.6,
    fontFamily: 'Playfair Display',
  },
});

function splitChapterAndNote(text) {
  const noteIdx = text.indexOf("AUTHOR'S NOTE");
  if (noteIdx === -1) return { chapter: text, note: null };
  return {
    chapter: text.slice(0, noteIdx).trim(),
    note: text.slice(noteIdx + "AUTHOR'S NOTE".length).trim(),
  };
}

export default function PDFDocument({ title, genre, chapterText }) {
  const { chapter, note } = splitChapterAndNote(chapterText || '');
  const paragraphs = chapter.split(/\n\n+/).filter(Boolean);

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <Text style={styles.coverGenre}>{(genre || 'Fiction').toUpperCase()}</Text>
        <Text style={styles.coverTitle}>{title || 'Untitled'}</Text>
        <Text style={styles.coverChapterLabel}>Chapter One</Text>
        <Text style={styles.coverBranding}>Generated with Kitabi</Text>
      </Page>

      {/* Chapter Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <Text style={styles.headerText}>{title || 'Untitled'}</Text>
          <Text style={[styles.headerText, { fontStyle: 'normal' }]}>Kitabi Demo</Text>
        </View>

        <View style={styles.body}>
          {paragraphs.map((para, i) => (
            <Text key={i} style={styles.paragraph}>{para}</Text>
          ))}
        </View>

        {note && (
          <>
            <View style={styles.separator} />
            <Text style={styles.authorNoteTitle}>Author's Note</Text>
            <Text style={styles.authorNoteBody}>{note}</Text>
          </>
        )}

        <Text style={styles.footer} render={({ pageNumber, totalPages }) =>
          `${pageNumber} / ${totalPages}`
        } fixed />
      </Page>
    </Document>
  );
}
