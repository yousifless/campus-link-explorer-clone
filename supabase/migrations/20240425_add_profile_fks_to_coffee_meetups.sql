ALTER TABLE coffee_meetups
ADD CONSTRAINT coffee_meetups_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE coffee_meetups
ADD CONSTRAINT coffee_meetups_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES profiles(id) ON DELETE CASCADE; 