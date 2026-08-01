import localforage from 'localforage';

// Configure instances for different collections
const dbProjects = localforage.createInstance({ name: 'gotek_db', storeName: 'projects' });
const dbStudents = localforage.createInstance({ name: 'gotek_db', storeName: 'students' });
const dbOrders = localforage.createInstance({ name: 'gotek_db', storeName: 'orders' });

export const projectService = {
  async getAll() {
    const projects = [];
    await dbProjects.iterate((value) => {
      projects.push(value);
    });
    return projects;
  },
  async getById(id) {
    return await dbProjects.getItem(id);
  },
  async create(data) {
    const id = data.id || `PROJ-${Date.now()}`;
    const newProject = { ...data, id, createdAt: new Date().toISOString() };
    await dbProjects.setItem(id, newProject);
    return newProject;
  },
  async update(id, data) {
    const existing = await this.getById(id) || {};
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    await dbProjects.setItem(id, updated);
    return updated;
  },
  async delete(id) {
    await dbProjects.removeItem(id);
    return { success: true };
  }
};

export const studentService = {
  async getAll(projectId) {
    const students = [];
    await dbStudents.iterate((value) => {
      if (!projectId || value.projectId === projectId) {
        students.push(value);
      }
    });
    return students;
  },
  async getById(id) {
    return await dbStudents.getItem(id);
  },
  async create(data) {
    const id = data.id || `STU-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    const newStudent = { ...data, id, createdAt: new Date().toISOString() };
    await dbStudents.setItem(id, newStudent);
    return newStudent;
  },
  async update(id, data) {
    const existing = await this.getById(id) || {};
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    await dbStudents.setItem(id, updated);
    return updated;
  },
  async delete(id) {
    await dbStudents.removeItem(id);
    return { success: true };
  },
  async bulkCreate(projectId, records) {
    const created = [];
    // Process sequentially or batch it for performance
    for (const record of records) {
      const id = record.id || `STU-${Date.now()}-${Math.floor(Math.random()*10000)}`;
      const newRec = { ...record, id, projectId, createdAt: new Date().toISOString() };
      await dbStudents.setItem(id, newRec);
      created.push(newRec);
    }
    return created;
  }
};

export const orderService = {
  async getAll() {
    const orders = [];
    await dbOrders.iterate((value) => {
      orders.push(value);
    });
    return orders;
  },
  async getById(id) {
    return await dbOrders.getItem(id);
  },
  async create(data) {
    const id = data.id || `ORD-${Date.now()}`;
    const newOrder = { ...data, id, createdAt: new Date().toISOString() };
    await dbOrders.setItem(id, newOrder);
    return newOrder;
  },
  async updateStatus(id, status) {
    const existing = await this.getById(id) || {};
    existing.status = status;
    await dbOrders.setItem(id, existing);
    return existing;
  }
};

// Mock Upload Service using IndexedDB to store base64 strings (for top-tier local demo without a real backend)
const dbUploads = localforage.createInstance({ name: 'gotek_db', storeName: 'uploads' });

export const uploadService = {
  async uploadPhoto(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result;
        const uploadId = `FILE-${Date.now()}-${Math.floor(Math.random()*1000)}`;
        // Save the file blob/base64 to IDB
        await dbUploads.setItem(uploadId, base64);
        
        // Return a virtual URL that we can resolve later (or just return the base64 if memory permits)
        // For absolute robustness, we return the base64 directly so the browser can render it.
        // In a real app, this would be a backend URL.
        resolve({ url: base64, path: uploadId });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
};
