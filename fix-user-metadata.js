// Run this in browser console to fix user metadata
// This will update your Clerk user metadata with correct company info

const updateUserMetadata = async () => {
  try {
    const response = await fetch('/api/fix-user-metadata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        companyId: 'codesphere_innovation',
        companyName: 'CodeSphere Innovation',
        planName: 'Free'
      })
    });
    
    const result = await response.json();
    console.log('Metadata update result:', result);
    
    if (response.ok) {
      console.log('✅ User metadata updated successfully!');
      console.log('🔄 Please refresh the page...');
      // Clear storage and refresh
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } else {
      console.error('❌ Failed to update metadata:', result);
    }
  } catch (error) {
    console.error('❌ Error updating metadata:', error);
  }
};

// Execute the update
updateUserMetadata();
