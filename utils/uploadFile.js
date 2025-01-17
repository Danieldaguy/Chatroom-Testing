import { supabase } from '../lib/supabaseClient';

export const sendFileToSupabase = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `profile_pictures/${fileName}`;

    const { data, error } = await supabase.storage
        .from('avatars') // Use Supabase Storage bucket named 'avatars'
        .upload(filePath, file);

    if (error) {
        console.error('Error uploading file:', error);
        return null;
    }

    return data?.Key ? `https://your-project-id.supabase.co/storage/v1/object/public/${filePath}` : null;
};