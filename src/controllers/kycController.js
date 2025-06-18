const { supabase, supabaseAdmin } = require('../config/supabaseClient');
const multer = require('multer');
const path = require('path');

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|pdf/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error(`File upload only supports the following filetypes - ${filetypes}`));
    }
}).single('document');

const uploadKycDocument = async (req, res) => {
  const leadId = req.params.leadId;
  const authenticatedUser = req.user;
  const { document_type } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: 'No document file provided.' });
  }
  if (!document_type) {
    return res.status(400).json({ message: 'Document type is required.' });
  }

  const validDocTypes = ['government_id', 'proof_of_address', 'selfie_with_id', 'other'];
  if (!validDocTypes.includes(document_type)) {
      return res.status(400).json({ message: `Invalid document type. Must be one of: ${validDocTypes.join(', ')}` });
  }

  try {
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, assigned_agent_id, kyc_status')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return res.status(404).json({ message: 'Lead not found.' });
    }

    if (authenticatedUser.role === 'agent' && lead.assigned_agent_id !== authenticatedUser.id) {
      return res.status(403).json({ message: 'Forbidden: Agent not assigned to this lead.' });
    }

    const file = req.file;
    const fileName = `${leadId}/${document_type}_${Date.now()}${path.extname(file.originalname)}`;
    const storageClient = supabaseAdmin || supabase;

    const { data: uploadData, error: uploadError } = await storageClient.storage
      .from('kyc-documents')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase Storage upload error:', uploadError);
      return res.status(500).json({ message: `Failed to upload document: ${uploadError.message}` });
    }

    const kycDocumentData = {
      lead_id: leadId,
      document_type: document_type,
      file_name: file.originalname,
      file_path: uploadData.path,
      file_size: file.size,
      mime_type: file.mimetype,
      status: 'pending',
      reviewed_by: null,
      reviewed_at: null,
    };

    const { data: dbRecord, error: dbError } = await supabase
      .from('kyc_documents')
      .insert(kycDocumentData)
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error for kyc_document:', dbError);
      await storageClient.storage.from('kyc-documents').remove([fileName]);
      return res.status(500).json({ message: `Failed to save document record: ${dbError.message}` });
    }

    if (lead.kyc_status === 'pending' || lead.kyc_status === 'rejected') {
        await supabase.from('leads').update({ kyc_status: 'submitted', updated_at: new Date().toISOString() }).eq('id', leadId);
    }

    res.status(201).json(dbRecord);

  } catch (error) {
    console.error('Server error during KYC document upload:', error);
    res.status(500).json({ message: 'Server error during document upload.' });
  }
};

const kycUploadMiddleware = (req, res, next) => {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: `Multer error: ${err.message}` });
        } else if (err) {
            if (err.message.startsWith('File upload only supports')) {
                 return res.status(400).json({ message: err.message });
            }
            return res.status(500).json({ message: `Unknown upload error: ${err.message}` });
        }
        next();
    });
};

const getKycStatusAndDocuments = async (req, res) => {
  const leadId = req.params.leadId;
  const authenticatedUser = req.user;

  try {
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, assigned_agent_id, kyc_status, kyc_rejection_reason, kyc_approved_at, kyc_approved_by')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return res.status(404).json({ message: 'Lead not found.' });
    }

    if (authenticatedUser.role === 'agent' && lead.assigned_agent_id !== authenticatedUser.id) {
      return res.status(403).json({ message: 'Forbidden: Agent not assigned to this lead.' });
    }

    const { data: documents, error: documentsError } = await supabase
      .from('kyc_documents')
      .select('*')
      .eq('lead_id', leadId)
      .order('upload_date', { ascending: false });

    if (documentsError) {
      console.error(`Error fetching KYC documents for lead ${leadId}:`, documentsError.message);
      return res.status(500).json({ message: 'Failed to fetch KYC documents.' });
    }

    res.status(200).json({
      lead_id: lead.id,
      kyc_status: lead.kyc_status,
      kyc_rejection_reason: lead.kyc_rejection_reason,
      kyc_approved_at: lead.kyc_approved_at,
      kyc_approved_by: lead.kyc_approved_by,
      documents: documents || [],
    });

  } catch (error) {
    console.error(`Server error fetching KYC status for lead ${leadId}:`, error);
    res.status(500).json({ message: 'Server error fetching KYC status and documents.' });
  }
};

// @desc    Download a specific KYC document
// @route   GET /api/kyc/documents/:documentId
// @access  Private (Admin or Agent assigned to the lead associated with the document)
const downloadKycDocument = async (req, res) => {
  const documentId = req.params.documentId;
  const authenticatedUser = req.user;

  try {
    // 1. Fetch the document record to get its path and associated lead_id
    const { data: document, error: docError } = await supabase
      .from('kyc_documents')
      .select('id, file_path, lead_id, lead:leads (id, assigned_agent_id)') // Join with leads table to get assigned_agent_id
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    // 2. Access Control: Check if agent is assigned to the lead associated with this document
    // Ensure document.lead is not null before accessing its properties
    if (authenticatedUser.role === 'agent' && (!document.lead || document.lead.assigned_agent_id !== authenticatedUser.id)) {
      return res.status(403).json({ message: 'Forbidden: You are not authorized to download this document.' });
    }

    // 3. Generate a signed URL for the document from Supabase Storage
    const storageClient = supabaseAdmin || supabase;
    const expiresIn = 300; // URL expires in 5 minutes (300 seconds)

    const { data: signedUrlData, error: signedUrlError } = await storageClient.storage
      .from('kyc-documents') // Bucket name
      .createSignedUrl(document.file_path, expiresIn);

    if (signedUrlError) {
      console.error(`Error creating signed URL for document ${documentId}:`, signedUrlError.message);
      return res.status(500).json({ message: 'Failed to create download link for the document.' });
    }

    // 4. Send the URL in JSON
    res.status(200).json({ downloadUrl: signedUrlData.signedUrl, fileName: path.basename(document.file_path) });

  } catch (error) {
    console.error(`Server error downloading document ${documentId}:`, error);
    res.status(500).json({ message: 'Server error downloading document.' });
  }
};

module.exports = {
  uploadKycDocument,
  kycUploadMiddleware,
  getKycStatusAndDocuments,
  downloadKycDocument, // Add this
};
