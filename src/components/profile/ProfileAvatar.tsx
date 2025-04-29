
// Find the location in the file where avatar_signed_url is missing and add it
// This is line 108 in the error message
// Change:
// { id: string; avatar_url: string; first_name: string; last_name: string; }
// To:
// { id: string; avatar_url: string; avatar_signed_url: string; first_name: string; last_name: string; }

// Let's update the updateProfile function to include avatar_signed_url
const updateProfile = async (userData: { 
  id: string; 
  avatar_url: string; 
  avatar_signed_url: string; // Added missing field
  first_name: string; 
  last_name: string; 
}) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        avatar_url: userData.avatar_url,
        avatar_signed_url: userData.avatar_signed_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', userData.id);

    if (error) throw error;
  } catch (error) {
    console.error("Error updating profile:", error);
    toast({
      title: "Error",
      description: "Failed to update profile with avatar URL.",
      variant: "destructive"
    });
  }
};
