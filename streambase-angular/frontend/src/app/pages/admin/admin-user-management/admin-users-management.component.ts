// admin-users-management.component.ts
import { Component, HostListener, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UsersManagementService } from '../../../core/services/admin/admin-users-management.service';
import { ConfirmDialogComponent } from '../../../components/dialogs/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-users-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './admin-users-management.component.html',
  styleUrls: ['./admin-users-management.component.scss']
})
export class AdminUsersManagementComponent implements OnInit {
  users: any[] = [];
  filteredUsers: any[] = [];
  loading = true;
  activeFilter = 'all';
  
  // Pagination
  page = 0;
  rowsPerPage = 20;
  pageSizeOptions = [20, 50, 100];
  
  // Table columns
  displayedColumns: string[] = ['name', 'email', 'password', 'status', 'privilege', 'actions'];

  // Header visibility
  hideHeader = false;
  private lastScrollTop = 0;
  
  private userManagementService = inject(UsersManagementService);
  private dialog = inject(MatDialog);

  ngOnInit(): void {
    this.fetchUsers();
  }
  
  fetchUsers(): void {
    this.loading = true;
    this.userManagementService.fetchUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.applyFilter();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching users:', error);
        this.loading = false;
      }
    });
  }
  
  applyFilter(): void {
    if (!this.users || this.users.length === 0) {
      this.filteredUsers = [];
      return;
    }
    
    let updatedUsers = [...this.users];
    
    switch (this.activeFilter) {
      case 'active':
        updatedUsers = updatedUsers.filter(user => !user.suspended);
        break;
      case 'suspended':
        updatedUsers = updatedUsers.filter(user => user.suspended);
        break;
      case 'user':
        updatedUsers = updatedUsers.filter(user => !user.privilege);
        break;
      case 'admin':
        updatedUsers = updatedUsers.filter(user => user.privilege);
        break;
      default:
        'all'
        break;
    }
    
    this.filteredUsers = updatedUsers;
  }
  
  handleFilter(filter: string): void {
    this.activeFilter = filter;
    this.page = 0; // Reset to first page when filter changes
    this.applyFilter();
  }
  
  openConfirmDialog(user: any, actionType: string): void {
    let title = '';
    let name = user.firstName + ' ' + user.lastName
    
    switch (actionType) {
      case 'delete':
        title = `Are you sure you want to delete ${name}?`;
        break;
      case 'suspend':
        title = `Suspend ${name}?`;
        break;
      case 'reinstate':
        title = `Reinstate ${name}?`;
        break;
      case 'promoteToAdmin':
        title = `Make ${name} an Admin?`;
        break;
      case 'revoke':
        title = `Revoke admin access for ${name}?`;
        break;
      case 'promote':
        title = `Promote ${name} to Level 2?`;
        break;
      case 'demote':
        title = `Demote ${name} to Level 1?`;
        break;
    }
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: { title, actionType }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.executeAction(user, actionType);
      }
    });
  }
  
  executeAction(user: any, actionType: string): void {
    switch (actionType) {
      case 'delete':
        this.handleDelete(user);
        break;
      case 'suspend':
        this.handleSuspend(user);
        break;
      case 'reinstate':
        this.handleReinstate(user);
        break;
      case 'promoteToAdmin':
        this.handlePromoteToAdmin(user);
        break;
      case 'revoke':
        this.handleRevokeAccess(user);
        break;
      case 'promote':
        this.handleChangePrivilege(user, "2");
        break;
      case 'demote':
        this.handleChangePrivilege(user, "1");
        break;
    }
  }
  
  handleDelete(user: any): void {
    this.userManagementService.deleteUser(user.id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== user.id);
        this.applyFilter();
      },
      error: (error) => console.error('Error deleting user:', error)
    });
  }
  
  handleSuspend(user: any): void {
    this.userManagementService.suspendUser(user).subscribe({
      next: (updatedUser) => {
        this.updateUserInList(updatedUser);
      },
      error: (error) => console.error('Error suspending user:', error)
    });
  }
  
  handleReinstate(user: any): void {
    this.userManagementService.reinstateUser(user).subscribe({
      next: (updatedUser) => {
        this.updateUserInList(updatedUser);
      },
      error: (error) => console.error('Error reinstating user:', error)
    });
  }
  
  handlePromoteToAdmin(user: any): void {
    this.userManagementService.promoteToAdmin(user).subscribe({
      next: (updatedUser) => {
        this.updateUserInList(updatedUser);
      },
      error: (error) => console.error('Error promoting user:', error)
    });
  }
  
  handleRevokeAccess(admin: any): void {
    this.userManagementService.revokeAdmin(admin).subscribe({
      next: (updatedUser) => {
        this.updateUserInList(updatedUser);
      },
      error: (error) => console.error('Error revoking admin access:', error)
    });
  }
  
  handleChangePrivilege(admin: any, newPrivilege: string): void {
    this.userManagementService.changePrivilege(admin, newPrivilege).subscribe({
      next: (updatedUser) => {
        this.updateUserInList(updatedUser);
      },
      error: (error) => console.error('Error changing privilege:', error)
    });
  }
  
  updateUserInList(updatedUser: any): void {
    this.users = this.users.map(u => u.id === updatedUser.id ? updatedUser : u);
    this.applyFilter();
  }
  
  handlePageEvent(event: PageEvent): void {
    this.page = event.pageIndex;
    this.rowsPerPage = event.pageSize;
  }
  
  handleSortByName(order: 'asc' | 'desc'): void {
    this.filteredUsers = [...this.filteredUsers].sort((a, b) => 
      order === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );
  }
  
  handleSortByUserStatus(status: 'active' | 'suspended'): void {
    this.filteredUsers = [...this.filteredUsers].sort((a, b) => {
      const suspendedA = a.suspended === true ? 1 : 0;
      const suspendedB = b.suspended === true ? 1 : 0;
      
      if (status === 'suspended') {
        return suspendedB - suspendedA; // Suspended users first
      } else {
        return suspendedA - suspendedB; // Active users first
      }
    });
  }
  
  handleSortByPrivilege(order: 'asc' | 'desc'): void {
    this.filteredUsers = [...this.filteredUsers].sort((a, b) => {
      const privilegeA = a.privilege ?? -1; // Assign -1 if null
      const privilegeB = b.privilege ?? -1; // Assign -1 if null
      
      return order === 'asc'
        ? privilegeA - privilegeB  // Sort Low to High (null at bottom)
        : privilegeB - privilegeA; // Sort High to Low (null at bottom)
    });
  }
  
  // Get paginated data for the table
  getPaginatedData(): any[] {
    const startIndex = this.page * this.rowsPerPage;
    return this.filteredUsers.slice(startIndex, startIndex + this.rowsPerPage);
  }

  @HostListener('window:scroll', [])
    onWindowScroll() {
      const currentScroll = window.scrollY;
  
      if (currentScroll > this.lastScrollTop) {
        this.hideHeader = true;
      } else {
        this.hideHeader = false;
      }
  
      this.lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    }
}
