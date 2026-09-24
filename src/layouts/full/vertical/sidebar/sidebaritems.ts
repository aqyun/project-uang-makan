export interface ChildItem {
  id?: number | string;
  name?: string;
  icon?: string;
  children?: ChildItem[];
  item?: unknown;
  url?: string;
  color?: string;
  disabled?: boolean;
  subtitle?: string;
  badge?: boolean;
  badgeType?: string;
  isPro?: boolean;
}

export interface MenuItem {
  heading?: string;
  name?: string;
  icon?: string;
  id?: number;
  to?: string;
  items?: MenuItem[];
  children?: ChildItem[];
  url?: string;
  disabled?: boolean;
  subtitle?: string;
  badgeType?: string;
  badge?: boolean;
  isPro?: boolean;
}

import { uniqueId } from 'lodash';

const SidebarContent: MenuItem[] = [
  // ==================== NON-PRO SECTIONS ====================
  {
    heading: 'Home',
    children: [
      {
        name: 'Modern',
        icon: 'solar:widget-2-linear',
        id: uniqueId(),
        url: '/',
        isPro: false,
      },
    ],
  },

  {
    heading: 'pages',
    children: [
      {
        name: 'Tables',
        icon: 'solar:server-linear',
        id: uniqueId(),
        url: '/utilities/table',
      },
      {
        name: 'Form',
        icon: 'solar:document-add-linear',
        id: uniqueId(),
        url: '/utilities/form',
      },
      {
        id: uniqueId(),
        name: 'User Profile',
        icon: 'solar:user-circle-linear',
        url: '/user-profile',
        isPro: false,
      },
    ],
  },
  {
    heading: 'Apps',
    children: [
      {
        id: uniqueId(),
        name: 'Notes',
        icon: 'solar:notes-linear',
        url: '/apps/notes',
        isPro: false,
      },
      {
        id: uniqueId(),
        name: 'Tickets',
        icon: 'solar:ticker-star-linear',
        url: '/apps/tickets',
        isPro: false,
      },
      {
        id: uniqueId(),
        name: 'Uang Makan',
        icon: 'solar:calculator-linear',
        url: '/apps/meal-allowance',
        isPro: false,
      },
      {
        name: 'Blogs',
        id: uniqueId(),
        icon: 'solar:sort-by-alphabet-linear',
        children: [
          {
            id: uniqueId(),
            name: 'Blog Post',
            url: '/apps/blog/post',
            isPro: false,
          },
          {
            id: uniqueId(),
            name: 'Blog Detail',
            url: '/apps/blog/detail/streaming-video-way-before-it-was-cool-go-dark-tomorrow',
            isPro: false,
          },
        ],
      },
    ],
  },
  {
    heading: 'AI',
    children: [
      {
        name: 'Ai Table Builder',
        icon: 'solar:server-linear',
        id: uniqueId(),
        url: '#!',
        isPro: false,
      },
      {
        name: 'Ai Form Builder',
        icon: 'solar:document-add-linear',
        id: uniqueId(),
        url: '#!',
        isPro: false,
      },
      {
        id: uniqueId(),
        name: 'Ai Chart Builder',
        icon: 'solar:pie-chart-2-linear',
        url: '#!',
        isPro: false,
      },
    ],
  },
  {
    heading: 'UI ELEMENTS',
    children: [
      {
        name: 'ShadCn',
        id: uniqueId(),
        icon: 'solar:slash-square-linear',
        children: [
          {
            id: uniqueId(),
            name: 'Avatar',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Badge',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Tooltip',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Skeleton',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Alert',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Progressbar',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Breadcrumb',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Tab',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Dropdown',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Accordion',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Card',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Carousel',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Collapsible',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Dialogs',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Drawer',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Datepicker',
            url: '#!',
          },
        ],
      },
    ],
  },
  {
    heading: 'FORM ELEMENTS',
    children: [
      {
        name: 'Shadcn Forms',
        id: uniqueId(),
        icon: 'solar:banknote-2-linear',
        children: [
          {
            id: uniqueId(),
            name: 'Button',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Input',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Select',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Checkbox',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Radio',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Combobox',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Command',
            url: '#!',
          },
        ],
      },
      {
        name: 'Form layouts',
        id: uniqueId(),
        icon: 'solar:documents-linear',
        children: [
          {
            id: uniqueId(),
            name: 'Form Examples',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Repeater Forms',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Form Wizard',
            url: '#!',
          },
        ],
      },
    ],
  },
  {
    heading: 'Widgets',
    children: [
      {
        name: 'Cards',
        id: uniqueId(),
        icon: 'solar:card-linear',
        children: [
          {
            id: uniqueId(),
            name: 'Top Cards',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Best Selling Product Card',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Payment Gatways Cards',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Blog Cards',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Products Cards',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Music Cards',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Profile Cards',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'User Cards',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Social Cards',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Settings Cards',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Gift Cards',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Upcomming Activity Cards',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Recent Transaction Card',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Recent Comment Card',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Task List',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Recent Messages',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'User info Card',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Social Card',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Feed Card',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Poll of Week Card',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Result of Poll',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Social Post Card',
            url: '#!',
          },
        ],
      },
      {
        name: 'Banners',
        id: uniqueId(),
        icon: 'solar:object-scan-linear',
        children: [
          {
            id: uniqueId(),
            name: 'Greeting Banner',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Download Banner',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Empty Cart Banner',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Error Banner',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Notifications Banner',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Greeting Banner 2',
            url: '#!',
          },
        ],
      },
      {
        name: 'Charts',
        id: uniqueId(),
        icon: 'solar:pie-chart-2-linear',
        children: [
          {
            id: uniqueId(),
            name: 'Revenue Updates Chart',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Yarly Breakup Chart',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Monthly Earning Chart',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Yearly Sales Chart',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Current Year Chart',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Weekly Stats Chart',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Expance Chart',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Customers Chart',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Earned Chart',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Follower Chart',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Visit Chart',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Income Chart',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Impressions Chart',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Sales Overviewchart',
            url: '#!',
          },
          {
            id: uniqueId(),
            name: 'Total Earnings Chart',
            url: '#!',
          },
        ],
      },
    ],
  },
  {
    heading: 'Icons',
    children: [
      {
        id: uniqueId(),
        name: 'Iconify Icons',
        icon: 'solar:structure-linear',
        url: '/icons/iconify',
        isPro: false,
      },
    ],
  },
  {
    heading: 'Auth',
    children: [
      {
        name: 'Login',
        id: uniqueId(),
        icon: 'solar:login-2-linear',
        children: [
          {
            id: uniqueId(),
            name: 'Boxed Login',
            url: '/auth/auth2/login',
            isPro: false,
          },
        ],
      },
      {
        name: 'Register',
        id: uniqueId(),
        icon: 'solar:user-plus-rounded-linear',
        children: [
          {
            id: uniqueId(),
            name: 'Boxed Register',
            url: '/auth/auth2/register',
            isPro: false,
          },
        ],
      },
    ],
  },
  // ==================== PRO SECTIONS ====================
  {
    heading: 'Home',
    children: [
      {
        name: 'Ecommerce',
        icon: 'solar:bag-5-linear',
        id: uniqueId(),
        url: '#!',
        isPro: true,
      },
      {
        name: 'Music',
        icon: 'solar:music-note-linear',
        id: uniqueId(),
        url: '#!',
        isPro: true,
      },
      {
        name: 'General',
        icon: 'solar:chart-linear',
        id: uniqueId(),
        url: '#!',
        isPro: true,
      },
      {
        name: 'Front Pages',
        id: uniqueId(),
        icon: 'solar:document-linear',
        children: [
          {
            id: uniqueId(),
            name: 'Homepage',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'About Us',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Blog',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Blog Details',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Contact Us',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Portfolio',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Pricing',
            url: '#!',
            isPro: true,
          },
        ],
      },
    ],
  },
  {
    heading: 'Apps',
    children: [
      {
        name: 'AI',
        id: uniqueId(),
        icon: 'solar:star-circle-linear',
        children: [
          {
            id: uniqueId(),
            name: 'Chat',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Image',
            url: '#!',
            isPro: true,
          },
        ],
      },
      {
        id: uniqueId(),
        name: 'Contacts',
        icon: 'solar:users-group-rounded-linear',
        url: '#!',
        isPro: true,
      },
      {
        name: 'Ecommerce',
        id: uniqueId(),
        icon: 'solar:cart-large-2-linear',
        children: [
          {
            id: uniqueId(),
            name: 'Shop',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Details',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'List',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Checkout',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Add Product',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Edit Product',
            url: '#!',
            isPro: true,
          },
        ],
      },
      {
        name: 'User Profile',
        id: uniqueId(),
        icon: 'solar:user-circle-linear',
        children: [
          {
            id: uniqueId(),
            name: 'Profile',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Followers',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Friends',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Gallery',
            url: '#!',
            isPro: true,
          },
        ],
      },
      {
        name: 'Invoice',
        id: uniqueId(),
        icon: 'solar:bill-list-linear',
        children: [
          {
            id: uniqueId(),
            name: 'List',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Details',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Create',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Edit',
            url: '#!',
            isPro: true,
          },
        ],
      },
      {
        id: uniqueId(),
        name: 'Chats',
        icon: 'solar:dialog-linear',
        url: '#!',
        isPro: true,
      },
      {
        id: uniqueId(),
        name: 'Calendar',
        icon: 'solar:calendar-linear',
        url: '#!',
        isPro: true,
      },
      {
        id: uniqueId(),
        name: 'Email',
        icon: 'solar:letter-linear',
        url: '#!',
        isPro: true,
      },
      {
        id: uniqueId(),
        name: 'Kanban',
        icon: 'solar:server-minimalistic-linear',
        url: '#!',
        isPro: true,
      },
      {
        id: uniqueId(),
        name: 'Customers',
        icon: 'solar:bedside-table-2-linear',
        url: '#!',
        isPro: true,
      },
      {
        id: uniqueId(),
        name: 'Orders',
        icon: 'solar:bedside-table-4-linear',
        url: '#!',
        isPro: true,
      },
    ],
  },
  {
    heading: 'UI ELEMENTS',
    children: [
      {
        name: 'Animated Comp',
        id: uniqueId(),
        icon: 'solar:reel-linear',
        children: [
          {
            id: uniqueId(),
            name: 'Button',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Card',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Text',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Tables',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Tooltip',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Lists',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Links',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Slider',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Forms',
            url: '#!',
            isPro: true,
          },
        ],
      },
    ],
  },
  {
    heading: 'FORM ELEMENTS',
    children: [
      {
        name: 'Form layouts',
        id: uniqueId(),
        icon: 'solar:documents-linear',
        children: [
          {
            id: uniqueId(),
            name: 'Forms Layouts',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Forms Horizontal',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Forms Vertical',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Form Validation',
            url: '#!',
            isPro: true,
          },
        ],
      },
      {
        name: 'Form Addons',
        id: uniqueId(),
        icon: 'solar:file-favourite-linear',
        children: [
          {
            id: uniqueId(),
            name: 'Select2',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Autocomplete',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Dropzone',
            url: '#!',
            isPro: true,
          },
        ],
      },
    ],
  },
  {
    heading: 'TABLES',
    children: [
      {
        name: 'Shadcn Tables',
        id: uniqueId(),
        icon: 'solar:tablet-linear',
        children: [
          {
            name: 'Basic Table',
            id: uniqueId(),
            url: '#!',
            isPro: true,
          },

        ],
      },
      {
        name: 'React Tables',
        id: uniqueId(),
        icon: 'solar:bedside-table-3-linear',
        children: [
          {
            id: uniqueId(),
            name: 'Basic',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Dense',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Sorting',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Filtering',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Pagination',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Row Selection',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Column Visibility',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Editable',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Sticky',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Drag & Drop',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Empty',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Expanding',
            url: '#!',
            isPro: true,
          },
        ],
      },
    ],
  },
  {
    heading: 'Charts',
    children: [
      {
        name: 'ApexCharts',
        id: uniqueId(),
        icon: 'solar:pie-chart-3-linear',
        children: [
          {
            name: 'Line Chart',
            id: uniqueId(),
            url: '#!',
            isPro: true,
          },
          {
            name: 'Area Chart',
            id: uniqueId(),
            url: '#!',
            isPro: true,
          },
          {
            name: 'Gradient Chart',
            id: uniqueId(),
            url: '#!',
            isPro: true,
          },
          {
            name: 'Candlestick',
            id: uniqueId(),
            url: '#!',
            isPro: true,
          },
          {
            name: 'Column',
            id: uniqueId(),
            url: '#!',
            isPro: true,
          },
          {
            name: 'Doughnut & Pie',
            id: uniqueId(),
            url: '#!',
            isPro: true,
          },
          {
            name: 'Radialbar & Radar',
            id: uniqueId(),
            url: '#!',
            isPro: true,
          },
        ],
      },
      {
        name: 'Shadcn Charts',
        id: uniqueId(),
        icon: 'solar:chart-2-linear',
        children: [
          {
            id: uniqueId(),
            name: 'Line Chart',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Area Chart',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Radar',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Bar',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Doughnut & Pie',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Radialbar & Radar',
            url: '#!',
            isPro: true,
          },
        ],
      },
    ],
  },
  {
    heading: 'pro Pages',
    children: [
      {
        name: 'Account Setting',
        icon: 'solar:settings-minimalistic-linear',
        id: uniqueId(),
        url: '#!',
        isPro: true,
      },
      {
        name: 'FAQ',
        icon: 'solar:question-circle-linear',
        id: uniqueId(),
        url: '#!',
        isPro: true,
      },
      {
        name: 'Pricing',
        icon: 'solar:tag-price-linear',
        id: uniqueId(),
        url: '#!',
        isPro: true,
      },
      {
        name: 'Landingpage',
        icon: 'solar:three-squares-linear',
        id: uniqueId(),
        url: '#!',
        isPro: true,
      },
      {
        name: 'Roll Base Access',
        icon: 'solar:accessibility-linear',
        id: uniqueId(),
        url: '#!',
        isPro: true,
      },
      {
        id: uniqueId(),
        name: 'Integrations',
        icon: 'solar:home-add-linear',
        url: '#!',
        isPro: true,
      },
      {
        id: uniqueId(),
        name: 'API Keys',
        icon: 'solar:key-linear',
        url: '#!',
        isPro: true,
      },
    ],
  },
  {
    heading: 'Auth',
    children: [
      {
        id: uniqueId(),
        name: 'Error',
        icon: 'solar:link-broken-minimalistic-linear',
        url: '#!',
        isPro: true,
      },
      {
        name: 'Login',
        id: uniqueId(),
        icon: 'solar:login-2-linear',
        children: [
          {
            id: uniqueId(),
            name: 'Side Login',
            url: '#!',
            isPro: true,
          },
        ],
      },
      {
        name: 'Register',
        id: uniqueId(),
        icon: 'solar:user-plus-rounded-linear',
        children: [
          {
            id: uniqueId(),
            name: 'Side Register',
            url: '#!',
            isPro: true,
          },
        ],
      },
      {
        name: 'Forgot Password',
        id: uniqueId(),
        icon: 'solar:password-linear',
        children: [
          {
            id: uniqueId(),
            name: 'Side Forgot Pwd',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Boxed Forgot Pwd',
            url: '#!',
            isPro: true,
          },
        ],
      },
      {
        name: 'Two Steps',
        id: uniqueId(),
        icon: 'solar:shield-keyhole-minimalistic-linear',
        children: [
          {
            id: uniqueId(),
            name: 'Side Two Steps',
            url: '#!',
            isPro: true,
          },
          {
            id: uniqueId(),
            name: 'Boxed Two Steps',
            url: '#!',
            isPro: true,
          },
        ],
      },
      {
        id: uniqueId(),
        name: 'Maintenance',
        icon: 'solar:settings-linear',
        url: '#!',
        isPro: true,
      },
    ],
  },
];

export default SidebarContent;
