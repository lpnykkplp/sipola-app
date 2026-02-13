import { supabase } from '../lib/supabaseClient';

export const api = {
    // --- AUTH / USERS ---
    async login(username, password) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password) // Basic plaintext auth for demo
            .single();
        if (error) throw error;
        return data;
    },

    async updateProfile(id, updates) {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // --- APEL LOGS ---
    async getApelLogs() {
        const { data, error } = await supabase
            .from('apel_logs')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async addApelLog(log) {
        const { data, error } = await supabase
            .from('apel_logs')
            .insert([log])
            .select();
        if (error) throw error;
        return data[0];
    },

    // --- ACTIVITY LOGS ---
    async getActivityLogs() {
        const { data, error } = await supabase
            .from('activity_logs')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async addActivityLog(log) {
        // Renaming fields to match DB schema if needed, but we used matching names
        // DB: user_name, description, time, date_iso, images
        // App state: name, desc, time, dateISO, images
        const dbLog = {
            id: log.id,
            user_name: log.name,
            description: log.desc,
            time: log.time,
            date_iso: log.dateISO,
            images: log.images
        };
        const { data, error } = await supabase
            .from('activity_logs')
            .insert([dbLog])
            .select();
        if (error) throw error;
        return data[0];
    },

    // --- SCAN LOGS ---
    async getScanLogs() {
        const { data, error } = await supabase
            .from('scan_logs')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async addScanLog(log) {
        const dbLog = {
            id: log.id,
            location: log.loc,
            status: log.status,
            description: log.desc,
            time: log.time,
            date_iso: log.dateISO
        };
        const { data, error } = await supabase
            .from('scan_logs')
            .insert([dbLog])
            .select();
        if (error) throw error;
        return data[0];
    },

    // --- QR POINTS (GENERATOR) ---
    async getQrPoints() {
        const { data, error } = await supabase
            .from('qr_points')
            .select('*')
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data;
    },

    async addQrPoint(point) {
        const { data, error } = await supabase
            .from('qr_points')
            .insert([point])
            .select();
        if (error) throw error;
        return data[0];
    }
};
