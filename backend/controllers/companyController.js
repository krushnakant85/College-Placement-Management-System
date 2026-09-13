const pool = require('../config/database');

/**
 * Controller: Get All Companies
 * Route: GET /api/companies, GET /api/admin/companies
 * Access: Public / Admin
 */
const getAllCompanies = async (req, res, next) => {
  try {
    // Select useful company details in ascending order of ID
    const query = `
      SELECT 
        id, 
        company_name, 
        location, 
        website, 
        description 
      FROM companies 
      ORDER BY id ASC
    `;

    const [companies] = await pool.query(query);

    return res.status(200).json({
      success: true,
      data: {
        companies: companies,
      },
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve companies.',
    });
  }
};

/**
 * Controller: Get Single Company by ID
 * Route: GET /api/companies/:companyId, GET /api/admin/companies/:companyId
 * Access: Public / Admin
 */
const getCompanyById = async (req, res, next) => {
  try {
    const { companyId } = req.params;

    // Validate that companyId is a strictly positive integer
    const parsedCompanyId = parseInt(companyId, 10);
    if (isNaN(parsedCompanyId) || parsedCompanyId <= 0 || String(parsedCompanyId) !== companyId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID.',
      });
    }

    // Parameterized query using placeholder ?
    const query = `
      SELECT 
        id, 
        company_name, 
        location, 
        website, 
        description 
      FROM companies 
      WHERE id = ?
    `;

    const [rows] = await pool.query(query, [parsedCompanyId]);

    // If no company found with this ID
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        company: rows[0],
      },
    });
  } catch (error) {
    console.error(`Error fetching company ID ${req.params.companyId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve company details.',
    });
  }
};

/**
 * Controller: Create Company
 * Route: POST /api/admin/companies
 * Access: Admin
 */
const createCompany = async (req, res, next) => {
  try {
    const { company_name, name, location, website, description } = req.body;

    // Normalize field values (supporting both company_name and name)
    const finalCompanyName = (company_name || name || '').trim();
    const finalLocation = (location || '').trim();
    const finalWebsite = website && typeof website === 'string' ? website.trim() : null;
    const finalDescription = description && typeof description === 'string' ? description.trim() : null;

    // Validate required fields
    if (!finalCompanyName) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Company name is required.',
      });
    }

    if (!finalLocation) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Location is required.',
      });
    }

    // Check for duplicate company name
    const [existing] = await pool.query(
      'SELECT id FROM companies WHERE company_name = ?',
      [finalCompanyName]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A company with this name already exists.',
      });
    }

    // Insert new company using parameterized SQL query
    const insertQuery = `
      INSERT INTO companies (company_name, location, website, description)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await pool.query(insertQuery, [
      finalCompanyName,
      finalLocation,
      finalWebsite,
      finalDescription,
    ]);

    return res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: {
        company: {
          id: result.insertId,
          company_name: finalCompanyName,
          location: finalLocation,
          website: finalWebsite,
          description: finalDescription,
        },
      },
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'A company with this name already exists.',
      });
    }
    console.error('Error creating company:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create company.',
    });
  }
};

/**
 * Controller: Update Company
 * Route: PUT /api/admin/companies/:companyId
 * Access: Admin
 */
const updateCompany = async (req, res, next) => {
  try {
    const { companyId } = req.params;

    // Validate companyId format
    const parsedCompanyId = parseInt(companyId, 10);
    if (isNaN(parsedCompanyId) || parsedCompanyId <= 0 || String(parsedCompanyId) !== companyId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID.',
      });
    }

    // Check if company exists in database
    const [existingRows] = await pool.query(
      'SELECT id, company_name, location, website, description FROM companies WHERE id = ?',
      [parsedCompanyId]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.',
      });
    }

    const currentCompany = existingRows[0];
    const { company_name, name, location, website, description } = req.body;

    // Ensure at least one field is provided for update
    if (
      company_name === undefined &&
      name === undefined &&
      location === undefined &&
      website === undefined &&
      description === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: At least one field must be provided to update.',
      });
    }

    // Determine and validate updated company name
    let finalCompanyName = currentCompany.company_name;
    if (company_name !== undefined || name !== undefined) {
      const candidateName = (company_name !== undefined ? company_name : name);
      if (typeof candidateName !== 'string' || candidateName.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Validation Error: Company name cannot be empty.',
        });
      }
      finalCompanyName = candidateName.trim();
    }

    // Determine and validate updated location
    let finalLocation = currentCompany.location;
    if (location !== undefined) {
      if (typeof location !== 'string' || location.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Validation Error: Location cannot be empty.',
        });
      }
      finalLocation = location.trim();
    }

    // Determine updated website and description
    let finalWebsite = currentCompany.website;
    if (website !== undefined) {
      finalWebsite = website && typeof website === 'string' ? website.trim() : null;
    }

    let finalDescription = currentCompany.description;
    if (description !== undefined) {
      finalDescription = description && typeof description === 'string' ? description.trim() : null;
    }

    // Check if new company name conflicts with another company
    if (finalCompanyName !== currentCompany.company_name) {
      const [nameConflict] = await pool.query(
        'SELECT id FROM companies WHERE company_name = ? AND id != ?',
        [finalCompanyName, parsedCompanyId]
      );
      if (nameConflict.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'A company with this name already exists.',
        });
      }
    }

    // Execute parameterized UPDATE query
    const updateQuery = `
      UPDATE companies 
      SET company_name = ?, location = ?, website = ?, description = ? 
      WHERE id = ?
    `;

    await pool.query(updateQuery, [
      finalCompanyName,
      finalLocation,
      finalWebsite,
      finalDescription,
      parsedCompanyId,
    ]);

    return res.status(200).json({
      success: true,
      message: 'Company updated successfully',
      data: {
        company: {
          id: parsedCompanyId,
          company_name: finalCompanyName,
          location: finalLocation,
          website: finalWebsite,
          description: finalDescription,
        },
      },
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'A company with this name already exists.',
      });
    }
    console.error(`Error updating company ${req.params.companyId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update company.',
    });
  }
};

/**
 * Controller: Delete Company
 * Route: DELETE /api/admin/companies/:companyId
 * Access: Admin
 */
const deleteCompany = async (req, res, next) => {
  try {
    const { companyId } = req.params;

    // Validate companyId
    const parsedCompanyId = parseInt(companyId, 10);
    if (isNaN(parsedCompanyId) || parsedCompanyId <= 0 || String(parsedCompanyId) !== companyId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID.',
      });
    }

    // Check if company exists
    const [existing] = await pool.query(
      'SELECT id FROM companies WHERE id = ?',
      [parsedCompanyId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.',
      });
    }

    // Application Safety: Check if any dependent jobs exist for this company
    const [jobRows] = await pool.query(
      'SELECT COUNT(*) AS job_count FROM jobs WHERE company_id = ?',
      [parsedCompanyId]
    );

    const jobCount = jobRows[0].job_count;
    if (jobCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'Company cannot be deleted because related jobs exist.',
      });
    }

    // Delete company safely using parameterized SQL
    await pool.query('DELETE FROM companies WHERE id = ?', [parsedCompanyId]);

    return res.status(200).json({
      success: true,
      message: 'Company deleted successfully.',
    });
  } catch (error) {
    console.error(`Error deleting company ${req.params.companyId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete company.',
    });
  }
};

module.exports = {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
};

