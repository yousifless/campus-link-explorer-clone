import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/utils/supabase';
import { toast } from 'sonner';
import { Club } from '@/types/clubs';
import { useAuth } from '@/contexts/AuthContext';
import {
  Link,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Paperclip,
  Plus,
  Trash2,
  Calendar,
  Download,
  Loader2,
  FileUp,
  Globe,
  Edit
} from 'lucide-react';

// Define types for resources
interface ClubResource {
  id: string;
  club_id: string;
  title: string;
  description: string | null;
  type: 'link' | 'file' | 'document';
  url: string;
  created_by: string;
  created_at: string;
  creator?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

interface ClubResourcesProps {
  club: Club;
  isAdmin: boolean;
}

const ClubResources = ({ club, isAdmin }: ClubResourcesProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<ClubResource[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<ClubResource | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resource form state
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    type: 'link',
    url: ''
  });
  const [resourceFile, setResourceFile] = useState<File | null>(null);

  // Load resources
  useEffect(() => {
    if (!club?.id) return;

    const fetchResources = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('club_resources')
          .select(`
            id,
            club_id,
            title,
            description,
            type,
            url,
            created_by,
            created_at,
            creator:profiles!club_resources_created_by_fkey(
              first_name,
              last_name,
              avatar_url
            )
          `)
          .eq('club_id', club.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setResources(data as ClubResource[]);
      } catch (error) {
        console.error('Error fetching club resources:', error);
        toast.error('Failed to load resources');
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [club?.id]);

  // Filter resources based on active tab
  const filteredResources = activeTab === 'all' 
    ? resources 
    : resources.filter(resource => resource.type === activeTab);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size should be less than 10MB");
      return;
    }
    
    setResourceFile(file);
    // Auto-fill title with filename if empty
    if (!newResource.title) {
      setNewResource(prev => ({
        ...prev,
        title: file.name.split('.')[0]
      }));
    }
  };

  // Handle add resource
  const handleAddResource = async () => {
    if (!club?.id || !user?.id || !newResource.title) {
      toast.error('Please enter a title for the resource');
      return;
    }
    
    setUploading(true);
    
    try {
      // If it's a link type resource
      if (newResource.type === 'link') {
        if (!newResource.url) {
          toast.error('Please enter a valid URL');
          return;
        }
        
        // Validate URL format
        try {
          new URL(newResource.url);
        } catch (e) {
          toast.error('Please enter a valid URL with http:// or https://');
          return;
        }
        
        // Insert resource into database
        const { data, error } = await supabase
          .from('club_resources')
          .insert({
            club_id: club.id,
            title: newResource.title,
            description: newResource.description || null,
            type: 'link',
            url: newResource.url,
            created_by: user.id
          })
          .select()
          .single();
          
        if (error) throw error;
        
        // Update state with new resource
        setResources(prev => [data as ClubResource, ...prev]);
        toast.success('Resource added successfully');
      } 
      // If it's a file upload
      else if (resourceFile) {
        // Upload file to storage
        const fileExt = resourceFile.name.split('.').pop();
        const fileName = `${club.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `club-resources/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('club-resources')
          .upload(filePath, resourceFile);
          
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('club-resources')
          .getPublicUrl(filePath);
          
        // Determine resource type based on file extension
        let resourceType: 'file' | 'document' = 'file';
        if (['doc', 'docx', 'pdf', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExt?.toLowerCase() || '')) {
          resourceType = 'document';
        }
        
        // Insert resource into database
        const { data, error } = await supabase
          .from('club_resources')
          .insert({
            club_id: club.id,
            title: newResource.title,
            description: newResource.description || null,
            type: resourceType,
            url: publicUrlData.publicUrl,
            created_by: user.id
          })
          .select()
          .single();
          
        if (error) throw error;
        
        // Update state with new resource
        setResources(prev => [data as ClubResource, ...prev]);
        toast.success('Resource uploaded successfully');
      } else {
        toast.error('Please select a file to upload');
        return;
      }
      
      // Reset form
      setNewResource({
        title: '',
        description: '',
        type: 'link',
        url: ''
      });
      setResourceFile(null);
      setIsAddDialogOpen(false);
      
    } catch (error) {
      console.error('Error adding resource:', error);
      toast.error('Failed to add resource');
    } finally {
      setUploading(false);
    }
  };
  
  // Handle edit resource
  const handleEditResource = (resource: ClubResource) => {
    setSelectedResource(resource);
    setNewResource({
      title: resource.title,
      description: resource.description || '',
      type: resource.type,
      url: resource.type === 'link' ? resource.url : ''
    });
    setIsEditDialogOpen(true);
  };
  
  // Handle update resource
  const handleUpdateResource = async () => {
    if (!selectedResource || !newResource.title) {
      toast.error('Please enter a title for the resource');
      return;
    }
    
    setUploading(true);
    
    try {
      // Can only update title, description and URL for link type
      if (selectedResource.type === 'link') {
        if (!newResource.url) {
          toast.error('Please enter a valid URL');
          return;
        }
        
        // Validate URL format
        try {
          new URL(newResource.url);
        } catch (e) {
          toast.error('Please enter a valid URL with http:// or https://');
          return;
        }
      }
      
      // Update resource in database
      const { error } = await supabase
        .from('club_resources')
        .update({
          title: newResource.title,
          description: newResource.description || null,
          ...(selectedResource.type === 'link' ? { url: newResource.url } : {})
        })
        .eq('id', selectedResource.id);
        
      if (error) throw error;
      
      // Update state
      setResources(prev => prev.map(res => 
        res.id === selectedResource.id 
          ? { 
              ...res, 
              title: newResource.title,
              description: newResource.description || null,
              ...(selectedResource.type === 'link' ? { url: newResource.url } : {})
            } 
          : res
      ));
      
      toast.success('Resource updated successfully');
      setIsEditDialogOpen(false);
      
    } catch (error) {
      console.error('Error updating resource:', error);
      toast.error('Failed to update resource');
    } finally {
      setUploading(false);
    }
  };
  
  // Handle delete resource
  const handleDeleteResource = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) {
      return;
    }
    
    try {
      // Get resource details first to check if it's a file
      const { data: resourceData, error: fetchError } = await supabase
        .from('club_resources')
        .select('type, url')
        .eq('id', id)
        .single();
        
      if (fetchError) throw fetchError;
      
      // If it's a file or document type, delete from storage
      if (resourceData.type !== 'link') {
        // Extract path from URL
        const url = new URL(resourceData.url);
        const pathMatch = url.pathname.match(/\/club-resources\/(.+)$/);
        
        if (pathMatch && pathMatch[1]) {
          const filePath = pathMatch[1];
          
          // Delete file from storage
          const { error: storageError } = await supabase.storage
            .from('club-resources')
            .remove([filePath]);
            
          if (storageError) {
            console.warn('Error deleting file from storage:', storageError);
            // Continue anyway to delete the database record
          }
        }
      }
      
      // Delete from database
      const { error } = await supabase
        .from('club_resources')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Update state
      setResources(prev => prev.filter(res => res.id !== id));
      toast.success('Resource deleted successfully');
      
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource');
    }
  };
  
  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };
  
  // Get icon for resource type
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'link':
        return <Link className="h-5 w-5 text-blue-500" />;
      case 'document':
        return <FileText className="h-5 w-5 text-orange-500" />;
      case 'file':
      default:
        return <Paperclip className="h-5 w-5 text-green-500" />;
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Club Resources</h2>
        {isAdmin && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default">
                <Plus className="mr-2 h-4 w-4" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add a Resource</DialogTitle>
                <DialogDescription>
                  Share a link or upload a file for club members
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <Tabs 
                  value={newResource.type} 
                  onValueChange={(val) => setNewResource(prev => ({ ...prev, type: val, url: '' }))}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="link" className="flex items-center justify-center">
                      <Globe className="mr-2 h-4 w-4" />
                      Link
                    </TabsTrigger>
                    <TabsTrigger value="file" className="flex items-center justify-center">
                      <FileUp className="mr-2 h-4 w-4" />
                      File Upload
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="link" className="space-y-4 mt-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="link-title" className="text-right text-sm">
                        Title
                      </label>
                      <Input
                        id="link-title"
                        value={newResource.title}
                        onChange={(e) => setNewResource(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Resource title"
                        className="col-span-3"
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="link-url" className="text-right text-sm">
                        URL
                      </label>
                      <Input
                        id="link-url"
                        value={newResource.url}
                        onChange={(e) => setNewResource(prev => ({ ...prev, url: e.target.value }))}
                        placeholder="https://example.com"
                        className="col-span-3"
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="link-description" className="text-right text-sm">
                        Description
                      </label>
                      <Textarea
                        id="link-description"
                        value={newResource.description}
                        onChange={(e) => setNewResource(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Optional description"
                        className="col-span-3"
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="file" className="space-y-4 mt-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="file-title" className="text-right text-sm">
                        Title
                      </label>
                      <Input
                        id="file-title"
                        value={newResource.title}
                        onChange={(e) => setNewResource(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Resource title"
                        className="col-span-3"
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="file-upload" className="text-right text-sm">
                        File
                      </label>
                      <div className="col-span-3">
                        <div className="flex items-center gap-2">
                          <Button 
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <FileUp className="mr-2 h-4 w-4" />
                            Choose File
                          </Button>
                          {resourceFile && (
                            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {resourceFile.name}
                            </span>
                          )}
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          id="file-upload"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="file-description" className="text-right text-sm">
                        Description
                      </label>
                      <Textarea
                        id="file-description"
                        value={newResource.description}
                        onChange={(e) => setNewResource(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Optional description"
                        className="col-span-3"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              <DialogFooter className="flex justify-between">
                <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddResource} disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Add Resource'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      {/* Resource Filter Tabs */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
          <TabsTrigger value="link" className="flex-1">Links</TabsTrigger>
          <TabsTrigger value="document" className="flex-1">Documents</TabsTrigger>
          <TabsTrigger value="file" className="flex-1">Files</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Resources Display */}
      {filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map(resource => (
            <Card key={resource.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xl">
                  {getResourceIcon(resource.type)}
                  <span className="truncate">{resource.title}</span>
                </CardTitle>
                <CardDescription className="flex items-center gap-1 text-xs">
                  <Calendar className="h-3 w-3" />
                  {formatRelativeTime(resource.created_at)}
                  {resource.creator && (
                    <>
                     <span>•</span>
                     {resource.creator.first_name} {resource.creator.last_name}
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                {resource.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {resource.description}
                  </p>
                )}
              </CardContent>
              <CardFooter className="justify-between">
                <div className="flex gap-2">
                  {resource.type === 'link' ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(resource.url, '_blank')}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open Link
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(resource.url, '_blank')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  )}
                </div>
                
                {(isAdmin || resource.created_by === user?.id) && (
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditResource(resource)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteResource(resource.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground mb-4">No resources available in this category</p>
            {isAdmin && (
              <Button 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add the first resource
              </Button>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Edit Resource Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>
              Update the details for this {selectedResource?.type}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-title" className="text-right text-sm">
                Title
              </label>
              <Input
                id="edit-title"
                value={newResource.title}
                onChange={(e) => setNewResource(prev => ({ ...prev, title: e.target.value }))}
                className="col-span-3"
              />
            </div>
            
            {selectedResource?.type === 'link' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="edit-url" className="text-right text-sm">
                  URL
                </label>
                <Input
                  id="edit-url"
                  value={newResource.url}
                  onChange={(e) => setNewResource(prev => ({ ...prev, url: e.target.value }))}
                  className="col-span-3"
                />
              </div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-description" className="text-right text-sm">
                Description
              </label>
              <Textarea
                id="edit-description"
                value={newResource.description}
                onChange={(e) => setNewResource(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter className="flex justify-between">
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateResource} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Resource'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClubResources; 