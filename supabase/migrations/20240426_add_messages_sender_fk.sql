-- Add foreign key relationship between messages and profiles tables
ALTER TABLE messages
ADD CONSTRAINT messages_sender_id_fkey
FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add an index for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- Add RLS policies for messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    JOIN matches m ON c.match_id = m.id
    WHERE c.id = messages.conversation_id
    AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages in their conversations"
ON messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c
    JOIN matches m ON c.match_id = m.id
    WHERE c.id = conversation_id
    AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
  )
  AND sender_id = auth.uid()
);

CREATE POLICY "Users can update their own messages"
ON messages FOR UPDATE
USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
ON messages FOR DELETE
USING (sender_id = auth.uid()); 