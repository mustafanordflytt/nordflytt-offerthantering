import { NextRequest, NextResponse } from 'next/server';

// Mock users database
let mockUsers = [
  { id: 1, name: 'Admin User', email: 'admin@nordflytt.se', role: 'admin', status: 'active', created: '2025-01-01' },
  { id: 2, name: 'Staff User', email: 'staff@nordflytt.se', role: 'staff', status: 'active', created: '2025-01-05' },
  { id: 3, name: 'Manager User', email: 'manager@nordflytt.se', role: 'manager', status: 'active', created: '2025-01-10' },
  { id: 4, name: 'Test Staff', email: 'test@nordflytt.se', role: 'staff', status: 'active', created: '2025-01-15' }
];

let userIdCounter = 100;

export async function GET(request: NextRequest) {
  try {
    // In production, check admin permissions here
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    
    let filteredUsers = [...mockUsers];
    
    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }
    
    if (status) {
      filteredUsers = filteredUsers.filter(user => user.status === status);
    }
    
    // Never return passwords
    const safeUsers = filteredUsers.map(user => {
      const { ...safeUser } = user;
      return safeUser;
    });
    
    return NextResponse.json({
      success: true,
      users: safeUsers,
      total: safeUsers.length
    });
    
  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve users'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    
    // Validate required fields
    if (!userData.name || !userData.email || !userData.role) {
      return NextResponse.json({
        success: false,
        error: 'Name, email, and role are required'
      }, { status: 400 });
    }
    
    // Check if email already exists
    const existingUser = mockUsers.find(u => u.email === userData.email);
    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User with this email already exists'
      }, { status: 409 });
    }
    
    // Create new user
    const newUser = {
      id: ++userIdCounter,
      name: userData.name,
      email: userData.email,
      role: userData.role || 'staff',
      status: userData.status || 'active',
      created: new Date().toISOString().split('T')[0]
    };
    
    mockUsers.push(newUser);
    
    return NextResponse.json({
      success: true,
      user: newUser,
      message: 'User created successfully'
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create user',
      details: error.message
    }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, ...updateData } = await request.json();
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }
    
    const userIndex = mockUsers.findIndex(user => user.id === id);
    if (userIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }
    
    // Update user
    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      ...updateData,
      id: mockUsers[userIndex].id, // Prevent ID change
      created: mockUsers[userIndex].created // Prevent created date change
    };
    
    return NextResponse.json({
      success: true,
      user: mockUsers[userIndex],
      message: 'User updated successfully'
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Failed to update user',
      details: error.message
    }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }
    
    const userIndex = mockUsers.findIndex(user => user.id === parseInt(id));
    if (userIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }
    
    // Don't delete admin users
    if (mockUsers[userIndex].role === 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete admin users'
      }, { status: 403 });
    }
    
    // Remove user
    const deletedUser = mockUsers.splice(userIndex, 1)[0];
    
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      deletedUser
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Failed to delete user',
      details: error.message
    }, { status: 400 });
  }
}