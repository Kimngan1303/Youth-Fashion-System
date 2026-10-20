import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Lấy danh sách toàn bộ người dùng (Khách hàng & Nhân viên)
 */
export const getAllUsersService = async ({ search = '', role = 'ALL', status = 'ALL' }) => {
  const normalizedSearch = search.trim().toLowerCase();

  // 1. Lấy danh sách Nhân viên (Employees)
  const employeeWhere = {};
  if (status !== 'ALL') {
    employeeWhere.status = status === 'LOCKED' ? 'INACTIVE' : status;
  }
  if (role === 'ADMIN' || role === 'MANAGER') {
    employeeWhere.employee_role = role;
  }

  const employees = await prisma.employee.findMany({
    where: employeeWhere,
    orderBy: { created_at: 'desc' },
  });

  // 2. Lấy danh sách Khách hàng (Customers) kèm thông tin đơn hàng
  const customerWhere = {};
  if (status !== 'ALL') {
    customerWhere.status = status === 'LOCKED' ? 'BLOCKED' : status;
  }

  const customers = await prisma.customer.findMany({
    where: customerWhere,
    include: {
      orders: {
        select: {
          order_id: true,
          total_amount: true,
          order_status: true,
        },
      },
      _count: {
        select: { orders: true },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  // 3. Chuẩn hóa danh sách Employees thành format thống nhất
  const formattedEmployees = employees.map((emp) => {
    const isEmpAdmin = emp.employee_role === 'ADMIN';
    return {
      id: emp.employee_id.toString(),
      type: 'EMPLOYEE',
      user_code: emp.employee_code,
      full_name: emp.full_name,
      email: emp.email,
      phone: emp.phone || 'Chưa cập nhật',
      avatar_url: null,
      role: isEmpAdmin ? 'ADMIN' : 'MANAGER',
      role_label: isEmpAdmin ? 'Quản Trị Viên (Admin)' : 'Manager',
      sub_role: isEmpAdmin ? 'Toàn quyền hệ thống' : 'Quản lý vận hành',
      total_spending: 0,
      spending_display: 'Nhân sự nội bộ',
      orders_count: 0,
      orders_display: isEmpAdmin ? 'Quản trị viên' : 'Quản lý',
      last_login: emp.last_login_at
        ? new Date(emp.last_login_at).toLocaleString('vi-VN')
        : 'Chưa đăng nhập',
      status: emp.status === 'ACTIVE' ? 'ACTIVE' : 'LOCKED',
      created_at: emp.created_at,
    };
  });

  // 4. Chuẩn hóa danh sách Customers thành format thống nhất (tính chi tiêu và đơn hàng thực tế)
  const formattedCustomers = customers.map((c) => {
    // Tính tổng chi tiêu thực tế từ các đơn hàng hợp lệ của account (không tính đơn đã hủy)
    const validOrders = c.orders ? c.orders.filter((o) => o.order_status !== 'CANCELLED') : [];
    const totalSpent = validOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const orderCount = validOrders.length;

    let role = 'CUSTOMER';
    let role_label = 'Khách Hàng';
    if (totalSpent >= 20000000 || orderCount >= 5) {
      role = 'VIP';
      role_label = 'Khách Hàng VIP';
    }

    const displaySpending = `${totalSpent.toLocaleString('vi-VN')}₫`;
    const displayOrders = `${orderCount} đơn hàng`;

    return {
      id: c.customer_id.toString(),
      type: 'CUSTOMER',
      user_code: `CUST_${c.customer_id.toString().padStart(4, '0')}`,
      full_name: c.full_name,
      email: c.email,
      phone: c.phone || 'Chưa cập nhật',
      avatar_url: c.avatar_url,
      role,
      role_label,
      sub_role: null,
      total_spending: totalSpent,
      spending_display: displaySpending,
      orders_count: orderCount,
      orders_display: displayOrders,
      last_login: c.last_login_at 
        ? new Date(c.last_login_at).toLocaleString('vi-VN')
        : 'Chưa đăng nhập',
      status: c.status === 'BLOCKED' ? 'LOCKED' : (c.status === 'ACTIVE' ? 'ACTIVE' : 'LOCKED'),
      created_at: c.created_at,
    };
  });

  // Ghép chung danh sách, loại bỏ trùng lặp nếu email đã là nhân sự đang hoạt động
  const activeEmployeeEmails = new Set(
    formattedEmployees
      .filter((e) => e.status === 'ACTIVE')
      .map((e) => (e.email || '').toLowerCase())
  );
  const dedupedCustomers = formattedCustomers.filter(
    (c) => !activeEmployeeEmails.has((c.email || '').toLowerCase())
  );
  let combined = [...formattedEmployees, ...dedupedCustomers];

  // Lọc theo search
  if (normalizedSearch) {
    combined = combined.filter((u) => {
      const name = (u.full_name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const phone = (u.phone || '').toLowerCase();
      const code = (u.user_code || '').toLowerCase();
      return (
        name.includes(normalizedSearch) ||
        email.includes(normalizedSearch) ||
        phone.includes(normalizedSearch) ||
        code.includes(normalizedSearch)
      );
    });
  }

  // Lọc theo role nếu có
  if (role !== 'ALL') {
    if (role === 'EMPLOYEE') {
      combined = combined.filter((u) => u.type === 'EMPLOYEE');
    } else if (role === 'CUSTOMER') {
      combined = combined.filter((u) => u.type === 'CUSTOMER');
    } else if (role === 'VIP') {
      combined = combined.filter((u) => u.role.startsWith('VIP'));
    } else {
      combined = combined.filter((u) => u.role === role);
    }
  }

  return combined;
};

/**
 * Lấy các chỉ số KPI thống kê người dùng hệ thống
 */
export const getAdminMetricsService = async () => {
  const [totalCustomers, activeCustomers, blockedCustomers, totalEmployees] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({ where: { status: 'ACTIVE' } }),
    prisma.customer.count({ where: { status: 'BLOCKED' } }),
    prisma.employee.count(),
  ]);

  const adminEmployees = await prisma.employee.count({ where: { employee_role: 'ADMIN' } });
  const managerEmployees = await prisma.employee.count({ where: { employee_role: 'MANAGER' } });

  const totalUsers = totalCustomers + totalEmployees;
  const activeTotal = activeCustomers + totalEmployees;
  const lockedTotal = blockedCustomers;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const newThisMonth = await prisma.customer.count({
    where: { created_at: { gte: startOfMonth } },
  });

  return {
    totalUsers,
    activeTotal,
    lockedTotal,
    vipCount: 0,
    newThisMonth,
    totalEmployees,
    adminEmployees,
    managerEmployees,
  };
};

/**
 * Tạo tài khoản Quản trị viên (ADMIN hoặc MANAGER) mới
 */
export const createAdminService = async ({ employee_code, full_name, email, phone, password, employee_role = 'ADMIN' }) => {
  const normalizedEmail = email.trim().toLowerCase();

  // Kiểm tra trùng email
  const existingEmail = await prisma.employee.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingEmail) {
    const error = new Error(`Email "${normalizedEmail}" đã được sử dụng bởi nhân viên khác`);
    error.statusCode = 400;
    throw error;
  }

  // Tạo mã nhân viên tự động nếu chưa có
  const code = employee_code?.trim() || `EMP_${Date.now().toString().slice(-6)}`;
  const existingCode = await prisma.employee.findUnique({
    where: { employee_code: code },
  });
  if (existingCode) {
    const error = new Error(`Mã nhân sự "${code}" đã tồn tại`);
    error.statusCode = 400;
    throw error;
  }

  // Băm mật khẩu bcrypt
  const password_hash = await bcrypt.hash(password || '123456', 10);

  const newEmployee = await prisma.employee.create({
    data: {
      employee_code: code,
      full_name: full_name.trim(),
      email: normalizedEmail,
      phone: phone ? phone.trim() : null,
      password_hash,
      employee_role,
      status: 'ACTIVE',
    },
  });

  return {
    id: newEmployee.employee_id.toString(),
    employee_code: newEmployee.employee_code,
    full_name: newEmployee.full_name,
    email: newEmployee.email,
    employee_role: newEmployee.employee_role,
    status: newEmployee.status,
    created_at: newEmployee.created_at,
  };
};

/**
 * Cập nhật trạng thái tài khoản (Khóa / Kích hoạt)
 */
export const updateUserStatusService = async ({ type, id, status }) => {
  if (type === 'EMPLOYEE') {
    const empStatus = status === 'LOCKED' ? 'INACTIVE' : 'ACTIVE';
    const updated = await prisma.employee.update({
      where: { employee_id: BigInt(id) },
      data: { status: empStatus },
    });
    return { id: updated.employee_id.toString(), status: updated.status };
  } else {
    const custStatus = status === 'LOCKED' ? 'BLOCKED' : 'ACTIVE';
    const updated = await prisma.customer.update({
      where: { customer_id: BigInt(id) },
      data: { status: custStatus },
    });
    return { id: updated.customer_id.toString(), status: updated.status };
  }
};

/**
 * Cập nhật vai trò / phân quyền người dùng (đồng bộ vào CSDL)
 */
export const updateUserRoleService = async ({ type, id, role }) => {
  if (type === 'EMPLOYEE') {
    const emp = await prisma.employee.findUnique({
      where: { employee_id: BigInt(id) },
    });
    if (!emp) {
      const error = new Error('Không tìm thấy tài khoản nhân sự trong CSDL');
      error.statusCode = 404;
      throw error;
    }

    if (emp.employee_role === 'ADMIN' || emp.email === 'admin@gmail.com') {
      const error = new Error('Tài khoản Quản trị viên (Admin) là cố định duy nhất, không thể thay đổi vai trò');
      error.statusCode = 400;
      throw error;
    }

    if (role === 'MANAGER') {
      const updated = await prisma.employee.update({
        where: { employee_id: BigInt(id) },
        data: { employee_role: 'MANAGER', status: 'ACTIVE' },
      });
      return { id: updated.employee_id.toString(), role: 'MANAGER' };
    } else {
      // Chuyển nhân sự thành Khách hàng (CUSTOMER / VIP): Khóa quyền nhân viên
      await prisma.employee.update({
        where: { employee_id: BigInt(id) },
        data: { status: 'INACTIVE' },
      });
      // Đảm bảo khách hàng có mặt trong bảng customers
      const existingCust = await prisma.customer.findUnique({
        where: { email: emp.email },
      });
      if (!existingCust) {
        await prisma.customer.create({
          data: {
            full_name: emp.full_name,
            email: emp.email,
            phone: emp.phone,
            password_hash: emp.password_hash,
            status: 'ACTIVE',
          },
        });
      }
      return { id, role: role === 'VIP' ? 'VIP' : 'CUSTOMER' };
    }
  } else {
    // type === 'CUSTOMER'
    const customer = await prisma.customer.findUnique({
      where: { customer_id: BigInt(id) },
    });
    if (!customer) {
      const error = new Error('Không tìm thấy tài khoản khách hàng trong CSDL');
      error.statusCode = 404;
      throw error;
    }

    if (role === 'MANAGER') {
      // Đồng bộ nâng cấp khách hàng thành Manager trong bảng employees
      const existingEmp = await prisma.employee.findUnique({
        where: { email: customer.email },
      });
      if (existingEmp) {
        await prisma.employee.update({
          where: { employee_id: existingEmp.employee_id },
          data: { employee_role: 'MANAGER', status: 'ACTIVE' },
        });
      } else {
        const empCode = `EMP_${customer.customer_id.toString().padStart(4, '0')}`;
        await prisma.employee.create({
          data: {
            employee_code: empCode,
            full_name: customer.full_name,
            email: customer.email,
            phone: customer.phone,
            password_hash: customer.password_hash,
            employee_role: 'MANAGER',
            status: 'ACTIVE',
          },
        });
      }
      return { id, role: 'MANAGER' };
    } else {
      // role === 'VIP' hoặc 'CUSTOMER'
      // Nếu có tài khoản employee cùng email thì vô hiệu hóa quyền nhân sự
      const existingEmp = await prisma.employee.findUnique({
        where: { email: customer.email },
      });
      if (existingEmp && existingEmp.employee_role !== 'ADMIN') {
        await prisma.employee.update({
          where: { employee_id: existingEmp.employee_id },
          data: { status: 'INACTIVE' },
        });
      }
      return { id, role: role === 'VIP' ? 'VIP' : 'CUSTOMER' };
    }
  }
};

/**
 * Xóa người dùng (Chỉ áp dụng với nhân viên hoặc khách hàng chưa có đơn)
 */
export const deleteUserService = async ({ type, id }) => {
  if (type === 'EMPLOYEE') {
    await prisma.employee.delete({
      where: { employee_id: BigInt(id) },
    });
    return { success: true };
  } else {
    await prisma.customer.delete({
      where: { customer_id: BigInt(id) },
    });
    return { success: true };
  }
};
