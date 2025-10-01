# SparkApply Design System Implementation Guide

*For developers and designers working on the SparkApply platform*

---

## 🚀 Quick Start

This guide helps you implement the SparkApply design system consistently across all platform components.

### Prerequisites
- Familiarity with React and Tailwind CSS
- Access to the SparkApply style guide
- Understanding of component-based design

---

## 🎨 Design Tokens

### CSS Custom Properties Setup

Add these custom properties to your root CSS file:

```css
:root {
  /* Brand Colors */
  --spark-orange-50: #FFF7ED;
  --spark-orange-100: #FFEDD5;
  --spark-orange-200: #FED7AA;
  --spark-orange-300: #FDBA74;
  --spark-orange-400: #FB923C;
  --spark-orange-500: #F97316;
  --spark-orange-600: #EA580C;
  --spark-orange-700: #C2410C;
  --spark-orange-800: #9A3412;
  --spark-orange-900: #7C2D12;

  --spark-red-50: #FEF2F2;
  --spark-red-100: #FEE2E2;
  --spark-red-200: #FECACA;
  --spark-red-300: #FCA5A5;
  --spark-red-400: #F87171;
  --spark-red-500: #EF4444;
  --spark-red-600: #DC2626;
  --spark-red-700: #B91C1C;
  --spark-red-800: #991B1B;
  --spark-red-900: #7F1D1D;

  /* Gradients */
  --spark-gradient: linear-gradient(135deg, var(--spark-orange-500) 0%, var(--spark-red-500) 100%);
  --spark-gradient-hover: linear-gradient(135deg, var(--spark-orange-600) 0%, var(--spark-red-600) 100%);

  /* Typography */
  --font-family-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  
  /* Spacing Scale */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */

  /* Border Radius */
  --radius-sm: 0.375rem;  /* 6px */
  --radius-md: 0.5rem;    /* 8px */
  --radius-lg: 0.75rem;   /* 12px */
  --radius-xl: 1rem;      /* 16px */
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
```

### Tailwind Configuration

Update your `tailwind.config.js`:

```javascript
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        spark: {
          orange: {
            50: '#FFF7ED',
            100: '#FFEDD5',
            200: '#FED7AA',
            300: '#FDBA74',
            400: '#FB923C',
            500: '#F97316',
            600: '#EA580C',
            700: '#C2410C',
            800: '#9A3412',
            900: '#7C2D12',
          },
          red: {
            50: '#FEF2F2',
            100: '#FEE2E2',
            200: '#FECACA',
            300: '#FCA5A5',
            400: '#F87171',
            500: '#EF4444',
            600: '#DC2626',
            700: '#B91C1C',
            800: '#991B1B',
            900: '#7F1D1D',
          }
        }
      },
      backgroundImage: {
        'spark-gradient': 'linear-gradient(135deg, #F97316 0%, #EF4444 100%)',
        'spark-gradient-hover': 'linear-gradient(135deg, #EA580C 0%, #DC2626 100%)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      }
    },
  },
  plugins: [],
}
```

---

## 🧩 Component Library

### Button Components

#### Primary Button
```jsx
const PrimaryButton = ({ children, onClick, disabled, loading, size = 'md', ...props }) => {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`
        bg-spark-gradient hover:bg-spark-gradient-hover
        text-white font-semibold rounded-lg
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-spark-orange-500 focus:ring-offset-2
        ${sizeClasses[size]}
        ${loading ? 'cursor-wait' : ''}
      `}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};
```

#### Secondary Button
```jsx
const SecondaryButton = ({ children, onClick, disabled, size = 'md', ...props }) => {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`
        border-2 border-spark-orange-500 text-spark-orange-500
        hover:bg-spark-orange-50 font-semibold rounded-lg
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-spark-orange-500 focus:ring-offset-2
        ${sizeClasses[size]}
      `}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
```

### Card Component
```jsx
const Card = ({ children, className = '', hover = false, ...props }) => {
  return (
    <div
      className={`
        bg-white rounded-xl border border-gray-200 shadow-md
        ${hover ? 'hover:shadow-lg transition-shadow duration-300' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`px-6 pb-6 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-xl font-semibold text-gray-900 mb-2 ${className}`}>
    {children}
  </h3>
);
```

### Badge Component
```jsx
const Badge = ({ children, variant = 'primary', size = 'md', className = '' }) => {
  const variants = {
    primary: 'bg-spark-orange-100 text-spark-orange-700',
    secondary: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};
```

### Input Component
```jsx
const Input = ({ label, error, className = '', ...props }) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-3 border-2 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-spark-orange-500 focus:border-transparent
          disabled:bg-gray-50 disabled:cursor-not-allowed
          ${error 
            ? 'border-red-300 focus:ring-red-500' 
            : 'border-gray-300 focus:ring-spark-orange-500'
          }
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
```

---

## 🎯 Usage Examples

### Landing Page Hero Section
```jsx
const HeroSection = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto text-center">
        <Badge className="mb-6">
          <Zap className="w-4 h-4 mr-2" />
          AI-Powered Job Discovery
        </Badge>
        
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-spark-gradient bg-clip-text text-transparent">
          Swipe Your Way to Your Dream Job
        </h1>
        
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          SparkApply revolutionizes job searching with AI-powered matching, 
          automated applications, and a Tinder-like interface.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <PrimaryButton size="lg">
            Start Swiping Jobs
            <ArrowRight className="ml-2 w-5 h-5" />
          </PrimaryButton>
          <SecondaryButton size="lg">
            Watch Demo
          </SecondaryButton>
        </div>
      </div>
    </section>
  );
};
```

### Feature Card Grid
```jsx
const FeatureGrid = () => {
  const features = [
    {
      icon: Heart,
      title: "Swipe-Based Discovery",
      description: "Browse jobs like dating apps - swipe right on opportunities you love.",
      color: "spark-orange"
    },
    {
      icon: Sparkles,
      title: "AI-Generated Applications",
      description: "Our AI creates tailored CVs and cover letters for each job.",
      color: "spark-red"
    },
    {
      icon: Target,
      title: "Smart Matching",
      description: "Advanced algorithms show you the most relevant opportunities first.",
      color: "spark-orange"
    }
  ];

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {features.map((feature, index) => (
        <Card key={index} hover className="text-center">
          <CardHeader>
            <div className={`w-12 h-12 bg-${feature.color}-100 rounded-lg flex items-center justify-center mx-auto mb-4`}>
              <feature.icon className={`w-6 h-6 text-${feature.color}-600`} />
            </div>
            <CardTitle>{feature.title}</CardTitle>
            <p className="text-gray-600">{feature.description}</p>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};
```

---

## 📱 Responsive Design Patterns

### Mobile-First Approach
```jsx
// Always start with mobile styles, then add larger breakpoints
const ResponsiveComponent = () => {
  return (
    <div className="
      px-4 py-8           // Mobile: 16px padding, 32px vertical
      md:px-8 md:py-12    // Tablet: 32px padding, 48px vertical
      lg:px-12 lg:py-16   // Desktop: 48px padding, 64px vertical
    ">
      <h2 className="
        text-2xl           // Mobile: 24px
        md:text-3xl        // Tablet: 30px
        lg:text-4xl        // Desktop: 36px
        font-bold mb-4
      ">
        Responsive Heading
      </h2>
    </div>
  );
};
```

### Container Patterns
```jsx
// Standard container with max-width
const Container = ({ children, className = '' }) => (
  <div className={`container mx-auto px-4 max-w-7xl ${className}`}>
    {children}
  </div>
);

// Section wrapper with consistent spacing
const Section = ({ children, className = '' }) => (
  <section className={`py-12 md:py-20 ${className}`}>
    <Container>
      {children}
    </Container>
  </section>
);
```

---

## 🔧 Development Guidelines

### Component Structure
```
src/
├── components/
│   ├── ui/              # Base UI components (Button, Input, Card)
│   ├── layout/          # Layout components (Header, Footer, Sidebar)
│   ├── features/        # Feature-specific components
│   └── common/          # Shared components
├── styles/
│   ├── globals.css      # Global styles and CSS custom properties
│   └── components.css   # Component-specific styles
└── assets/
    ├── images/          # Images and icons
    └── fonts/           # Custom fonts (if any)
```

### Naming Conventions
- **Components**: PascalCase (e.g., `PrimaryButton`, `JobCard`)
- **Props**: camelCase (e.g., `onClick`, `isLoading`)
- **CSS Classes**: kebab-case for custom classes, follow Tailwind for utilities
- **Files**: kebab-case (e.g., `primary-button.jsx`, `job-card.jsx`)

### Best Practices

#### ✅ Do's
- Use semantic HTML elements
- Implement proper ARIA labels for accessibility
- Follow the established color palette
- Use consistent spacing from the design system
- Test components on multiple screen sizes
- Document component props and usage

#### ❌ Don'ts
- Don't create custom colors outside the design system
- Don't use inline styles unless absolutely necessary
- Don't ignore accessibility requirements
- Don't hardcode spacing values
- Don't create components without proper TypeScript types

---

## 🧪 Testing Guidelines

### Component Testing
```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { PrimaryButton } from './PrimaryButton';

describe('PrimaryButton', () => {
  it('renders with correct text', () => {
    render(<PrimaryButton>Click me</PrimaryButton>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<PrimaryButton onClick={handleClick}>Click me</PrimaryButton>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<PrimaryButton loading>Click me</PrimaryButton>);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
```

### Visual Regression Testing
Use tools like Chromatic or Percy to catch visual changes:

```jsx
// .storybook/main.js
export default {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-essentials'],
};

// Button.stories.jsx
export default {
  title: 'Components/Button',
  component: PrimaryButton,
};

export const Default = {
  args: {
    children: 'Primary Button',
  },
};

export const Loading = {
  args: {
    children: 'Loading Button',
    loading: true,
  },
};
```

---

## 📚 Resources

### Design System Tools
- **Figma**: SparkApply Design System Library
- **Storybook**: Component documentation and testing
- **Chromatic**: Visual regression testing
- **Tailwind CSS**: Utility-first CSS framework

### Accessibility Resources
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Performance Guidelines
- Use `React.memo()` for expensive components
- Implement lazy loading for images and components
- Optimize bundle size with tree shaking
- Use CSS-in-JS solutions sparingly

---

## 🔄 Updates and Maintenance

### Version Control
- Follow semantic versioning for design system updates
- Document breaking changes in CHANGELOG.md
- Use feature flags for experimental components

### Review Process
1. Design review with design team
2. Code review with development team
3. Accessibility audit
4. Performance testing
5. Visual regression testing

---

*This implementation guide is updated regularly. Check the latest version before starting new projects.*
