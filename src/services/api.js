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
    },

    // --- SENT REPORTS ---
    async getReports() {
        const { data, error } = await supabase
            .from('sent_reports')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async addReport(report) {
        const dbReport = {
            sender_name: report.senderName,
            petugas_jaga: report.petugasJaga,
            report_date: report.date,
            date_formatted: report.dateFormatted,
            wbp_count: report.wbpCount,
            activities_count: report.activitiesCount,
            activities_summary: report.activitiesSummary,
            status: report.status || 'pending',
            sent_at: report.sentAt
        };
        const { data, error } = await supabase
            .from('sent_reports')
            .insert([dbReport])
            .select();
        if (error) throw error;
        return data[0];
    },

    async updateReportStatus(id, status) {
        const { data, error } = await supabase
            .from('sent_reports')
            .update({ status })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // --- ASTEKPAM LOGS ---
    async getAstekpamLogs() {
        const { data, error } = await supabase
            .from('astekpam_logs')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async addAstekpamLog(log) {
        const dbLog = {
            shift: log.shift,
            petugas_lama: log.petugasLama,
            petugas_baru: log.petugasBaru,
            inventaris: log.inventaris,
            wbp_total: log.wbpTotal,
            wbp_sakit: log.wbpSakit,
            wbp_bon: log.wbpBon,
            catatan: log.catatan,
            date_iso: log.dateISO,
            status: log.status || 'pending'
        };
        const { data, error } = await supabase
            .from('astekpam_logs')
            .insert([dbLog])
            .select();
        if (error) throw error;
        return data[0];
    },

    async updateAstekpamStatus(id, status) {
        const { data, error } = await supabase
            .from('astekpam_logs')
            .update({ status })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateAstekpamLog(id, log) {
        const updates = {
            shift: log.shift,
            petugas_lama: log.petugasLama,
            petugas_baru: log.petugasBaru,
            inventaris: log.inventaris,
            wbp_total: log.wbpTotal,
            wbp_sakit: log.wbpSakit,
            wbp_bon: log.wbpBon,
            catatan: log.catatan
        };
        const { data, error } = await supabase
            .from('astekpam_logs')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteAstekpamLog(id) {
        const { error } = await supabase
            .from('astekpam_logs')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};
