
// Find the locations where CSS properties are causing type errors and fix them:
// Line 264: overflowY should be typed as 'auto' | 'hidden' | 'scroll' etc.
// Line 266, 268: textAlign should be typed as 'left' | 'right' | 'center' etc.

// Example fix:
const chatContainerStyle: React.CSSProperties = {
  height: '400px',
  overflowY: 'auto', // Fix: use specific value instead of generic string
  padding: '16px',
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
  marginBottom: '16px',
  border: '1px solid #e2e8f0'
};

const emptyStateStyle: React.CSSProperties = {
  textAlign: 'center', // Fix: use specific value instead of generic string
  padding: '20px'
};

const loadingStateStyle: React.CSSProperties = {
  textAlign: 'center', // Fix: use specific value instead of generic string
  padding: '20px',
  color: '#718096'
};

const messagesContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column' as 'column' // Fix: explicitly type as 'column'
};
