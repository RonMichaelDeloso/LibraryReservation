import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Book {
    title: string;
    author: string;
    isbn?: string;
    category?: string;
    quantity?: number;
    unit?: string;
    description?: string;
    rating?: number;
}

interface Booking {
    user: string;
    book: string;
    borrowDate: string;
    returnDate: string;
    status: string;
}

interface Unit {
    name: string;
    totalBooks: number;
    available: number;
    location: string;
}

interface Notification {
    icon: string;
    message: string;
    time: string;
    type: string;
    action?: boolean;
}

interface Activity {
    icon: string;
    text: string;
    time: string;
    type: string;
}

interface RecentBook {
    title: string;
    author: string;
    category: string;
    quantity: number;
}

@Component({
    selector: 'app-admin-library',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './admin-library.component.html',
    styleUrls: ['./admin-library.component.scss']
})
export class AdminLibraryComponent implements OnInit {
    // Sidebar state
    isSidebarCollapsed = false;
    isMobile = false;

    // Active route
    activeRoute: string = 'home';

    // Notification count
    notificationCount = 5;

    // New book form model
    newBook: Book = {
        title: '',
        author: '',
        isbn: '',
        category: '',
        quantity: 1,
        unit: '',
        description: ''
    };

    // Selected file for book cover
    selectedFile: File | null = null;

    // Sample data for recent activities
    recentActivities: Activity[] = [
        {
            icon: 'book',
            text: 'John Doe borrowed "The Great Gatsby"',
            time: '5 minutes ago',
            type: 'borrow'
        },
        {
            icon: 'book',
            text: 'Jane Smith returned "1984"',
            time: '1 hour ago',
            type: 'return'
        },
        {
            icon: 'add',
            text: 'New book added: "Atomic Habits"',
            time: '3 hours ago',
            type: 'add'
        },
        {
            icon: 'book',
            text: 'Mike Johnson borrowed "To Kill a Mockingbird"',
            time: '5 hours ago',
            type: 'borrow'
        },
        {
            icon: 'book',
            text: 'Sarah Wilson returned "Pride and Prejudice"',
            time: '1 day ago',
            type: 'return'
        }
    ];

    // Sample notifications
    notifications: Notification[] = [
        {
            icon: 'book',
            message: 'New book added to inventory',
            time: '10 minutes ago',
            type: 'info',
            action: true
        },
        {
            icon: 'check_circle',
            message: 'Booking #1234 has been approved',
            time: '1 hour ago',
            type: 'success',
            action: true
        },
        {
            icon: 'warning',
            message: 'Book "The Great Gatsby" is due for return',
            time: '3 hours ago',
            type: 'warning',
            action: true
        },
        {
            icon: 'error',
            message: 'Overdue book return from user John Doe',
            time: '5 hours ago',
            type: 'error',
            action: true
        },
        {
            icon: 'person',
            message: 'New user registration: Alice Johnson',
            time: '1 day ago',
            type: 'info',
            action: true
        }
    ];

    // Sample bookings
    bookings: Booking[] = [
        {
            user: 'John Doe',
            book: 'The Great Gatsby',
            borrowDate: '2024-03-01',
            returnDate: '2024-03-15',
            status: 'Approved'
        },
        {
            user: 'Jane Smith',
            book: '1984',
            borrowDate: '2024-03-05',
            returnDate: '2024-03-19',
            status: 'Pending'
        },
        {
            user: 'Mike Johnson',
            book: 'To Kill a Mockingbird',
            borrowDate: '2024-02-28',
            returnDate: '2024-03-14',
            status: 'Returned'
        },
        {
            user: 'Sarah Wilson',
            book: 'Pride and Prejudice',
            borrowDate: '2024-03-10',
            returnDate: '2024-03-24',
            status: 'Approved'
        },
        {
            user: 'Robert Brown',
            book: 'The Catcher in the Rye',
            borrowDate: '2024-03-08',
            returnDate: '2024-03-22',
            status: 'Pending'
        }
    ];

    // Sample units
    units: Unit[] = [
        {
            name: 'Main Library',
            totalBooks: 15420,
            available: 12350,
            location: 'Central Campus'
        },
        {
            name: 'North Branch',
            totalBooks: 8930,
            available: 7120,
            location: 'North District'
        },
        {
            name: 'South Branch',
            totalBooks: 7650,
            available: 6540,
            location: 'South District'
        },
        {
            name: 'East Branch',
            totalBooks: 5430,
            available: 4320,
            location: 'East District'
        },
        {
            name: 'West Branch',
            totalBooks: 6780,
            available: 5890,
            location: 'West District'
        }
    ];

    // Sample recent books for "Add Books" section
    recentBooks: RecentBook[] = [
        {
            title: 'Atomic Habits',
            author: 'James Clear',
            category: 'Self-Help',
            quantity: 5
        },
        {
            title: 'The Psychology of Money',
            author: 'Morgan Housel',
            category: 'Finance',
            quantity: 3
        },
        {
            title: 'Dune',
            author: 'Frank Herbert',
            category: 'Science Fiction',
            quantity: 4
        },
        {
            title: 'Project Hail Mary',
            author: 'Andy Weir',
            category: 'Science Fiction',
            quantity: 2
        }
    ];

    // All books data
    allBooks: Book[] = [
        { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'Fiction' },
        { title: 'To Kill a Mockingbird', author: 'Harper Lee', category: 'Fiction' },
        { title: '1984', author: 'George Orwell', category: 'Science Fiction' },
        { title: 'Pride and Prejudice', author: 'Jane Austen', category: 'Romance' },
        { title: 'The Catcher in the Rye', author: 'J.D. Salinger', category: 'Fiction' },
        { title: 'The Hobbit', author: 'J.R.R. Tolkien', category: 'Fantasy' },
        { title: 'Fahrenheit 451', author: 'Ray Bradbury', category: 'Science Fiction' },
        { title: 'Moby Dick', author: 'Herman Melville', category: 'Classic' }
    ];

    ngOnInit() {
        this.checkScreenSize();
        this.loadUserPreferences();
        this.loadRecentBooks();
    }

    @HostListener('window:resize', ['$event'])
    onResize() {
        this.checkScreenSize();
    }

    /**
     * Check screen size and adjust sidebar accordingly
     */
    checkScreenSize() {
        this.isMobile = window.innerWidth <= 768;
        if (this.isMobile) {
            this.isSidebarCollapsed = true;
        }
    }

    /**
     * Toggle sidebar collapsed state
     */
    toggleSidebar() {
        this.isSidebarCollapsed = !this.isSidebarCollapsed;
    }

    /**
     * Set active route
     */
    setActiveRoute(route: string) {
        this.activeRoute = route;
        // In a real app, you might use router.navigate here
        // this.router.navigate([route]);

        // Close sidebar on mobile after navigation
        if (this.isMobile) {
            this.isSidebarCollapsed = true;
        }
    }

    /**
     * Get page title based on active route
     */
    getPageTitle(): string {
        const titles: { [key: string]: string } = {
            'home': 'Dashboard',
            'notification': 'Notifications',
            'booking': 'Bookings',
            'unit': 'Library Units',
            'settings': 'Settings',
            'add-books': 'Add Books'
        };
        return titles[this.activeRoute] || 'Dashboard';
    }

    /**
     * Load user preferences from localStorage
     */
    loadUserPreferences() {
        try {
            const savedSettings = localStorage.getItem('adminSettings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                // Apply saved settings if needed
            }
        } catch (error) {
            console.error('Error loading user preferences:', error);
        }
    }

    /**
     * Load recent books (in real app, this would come from a service)
     */
    loadRecentBooks() {
        // This would typically be an API call
        // For now, using mock data
        this.recentBooks = [
            {
                title: 'Atomic Habits',
                author: 'James Clear',
                category: 'Self-Help',
                quantity: 5
            },
            {
                title: 'The Psychology of Money',
                author: 'Morgan Housel',
                category: 'Finance',
                quantity: 3
            },
            {
                title: 'Dune',
                author: 'Frank Herbert',
                category: 'Science Fiction',
                quantity: 4
            },
            {
                title: 'Project Hail Mary',
                author: 'Andy Weir',
                category: 'Science Fiction',
                quantity: 2
            }
        ];
    }

    /**
     * Handle file selection for book cover
     */
    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            // Check file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }

            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('File size should be less than 5MB');
                return;
            }

            this.selectedFile = file;
            console.log('File selected:', file.name);
        }
    }

    /**
     * Add new book to library
     */
    addBook() {
        // Validate form
        if (!this.newBook.title || !this.newBook.author) {
            alert('Please fill in all required fields');
            return;
        }

        // In real app, this would send data to backend
        console.log('Adding new book:', this.newBook);
        console.log('Selected file:', this.selectedFile);

        // Show success message
        alert(`Book "${this.newBook.title}" has been added successfully!`);

        // Add to recent books list
        if (this.newBook.title && this.newBook.author) {
            this.recentBooks.unshift({
                title: this.newBook.title,
                author: this.newBook.author,
                category: this.newBook.category || 'Uncategorized',
                quantity: this.newBook.quantity || 1
            });

            // Keep only last 5 recent books
            if (this.recentBooks.length > 5) {
                this.recentBooks.pop();
            }
        }

        // Reset form
        this.resetAddBookForm();
    }

    /**
     * Reset add book form
     */
    resetAddBookForm() {
        this.newBook = {
            title: '',
            author: '',
            isbn: '',
            category: '',
            quantity: 1,
            unit: '',
            description: ''
        };
        this.selectedFile = null;

        // Reset file input
        const fileInput = document.getElementById('coverImage') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    }

    /**
     * Cancel add book operation
     */
    cancelAddBook() {
        if (confirm('Are you sure you want to cancel? All entered data will be lost.')) {
            this.resetAddBookForm();
        }
    }

    /**
     * Filter bookings by status
     */
    filterBookings(status: string) {
        console.log('Filtering bookings by:', status);
        // In real app, this would filter the bookings list
        // For now, just log the action
    }

    /**
     * Approve booking
     */
    approveBooking(booking: Booking) {
        console.log('Approving booking:', booking);
        booking.status = 'Approved';
        // In real app, this would call an API
    }

    /**
     * Reject booking
     */
    rejectBooking(booking: Booking) {
        console.log('Rejecting booking:', booking);
        booking.status = 'Rejected';
        // In real app, this would call an API
    }

    /**
     * Delete booking
     */
    deleteBooking(booking: Booking) {
        if (confirm(`Are you sure you want to delete booking for ${booking.book}?`)) {
            const index = this.bookings.indexOf(booking);
            if (index > -1) {
                this.bookings.splice(index, 1);
                console.log('Booking deleted:', booking);
            }
        }
    }

    /**
     * Mark all notifications as read
     */
    markAllAsRead() {
        this.notificationCount = 0;
        console.log('All notifications marked as read');
        // In real app, this would call an API
    }

    /**
     * Get notification icon color based on type
     */
    getNotificationIconClass(type: string): string {
        const classes: { [key: string]: string } = {
            'info': 'info',
            'success': 'success',
            'warning': 'warning',
            'error': 'error'
        };
        return classes[type] || 'info';
    }

    /**
     * Get status badge class
     */
    getStatusClass(status: string): string {
        return status.toLowerCase();
    }

    /**
     * Handle unit action
     */
    onUnitAction(unit: Unit) {
        console.log('Unit action clicked for:', unit.name);
        // In real app, this would open a modal or navigate to unit details
    }

    /**
     * Handle notification action
     */
    onNotificationAction(notification: Notification) {
        console.log('Notification action clicked:', notification);
        // In real app, this would perform an action based on notification type
    }

    /**
     * Handle search
     */
    onSearch(query: string) {
        console.log('Searching for:', query);
        // In real app, this would trigger search functionality
    }

    /**
     * Get book category count
     */
    getBookCountByCategory(category: string): number {
        return this.allBooks.filter(book => book.category === category).length;
    }

    /**
     * Get total books count
     */
    getTotalBooksCount(): number {
        return this.allBooks.length;
    }

    /**
     * Get active bookings count
     */
    getActiveBookingsCount(): number {
        return this.bookings.filter(booking =>
            booking.status === 'Approved' || booking.status === 'Pending'
        ).length;
    }

    /**
     * Get total units count
     */
    getTotalUnitsCount(): number {
        return this.units.length;
    }

    /**
     * Get total books in all units
     */
    getTotalBooksInUnits(): number {
        return this.units.reduce((total, unit) => total + unit.totalBooks, 0);
    }

    /**
     * Get available books count
     */
    getAvailableBooksCount(): number {
        return this.units.reduce((total, unit) => total + unit.available, 0);
    }
}