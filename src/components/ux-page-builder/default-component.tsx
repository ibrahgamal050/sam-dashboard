import React from 'react';
import { Theme } from '@/lib/themes';

interface DefaultComponentProps {
  theme: Theme;
}

export const DefaultComponent: React.FC<DefaultComponentProps> = ({ theme }) => {
  return (
    <div style={{ 
      backgroundColor: theme.colors.background, 
      color: theme.colors.text,
      fontFamily: theme.fonts.body,
      padding: '2rem',
    }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          color: theme.colors.primary,
          fontFamily: theme.fonts.heading,
          fontSize: '2.5rem',
          marginBottom: '1rem',
        }}>
          Welcome to Our Website
        </h1>
        <nav>
          <ul style={{ display: 'flex', gap: '1rem', listStyle: 'none', padding: 0 }}>
            {['Home', 'About', 'Services', 'Contact'].map((item) => (
              <li key={item}>
                <a href="#" style={{ color: theme.colors.secondary, textDecoration: 'none' }}>
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main>
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ 
            color: theme.colors.primary,
            fontFamily: theme.fonts.heading,
            fontSize: '1.8rem',
            marginBottom: '1rem',
          }}>
            About Us
          </h2>
          <p>
            We are a company dedicated to providing high-quality services to our customers.
            Our team of experts is committed to delivering innovative solutions that meet your needs.
          </p>
        </section>
        <section>
          <h2 style={{ 
            color: theme.colors.primary,
            fontFamily: theme.fonts.heading,
            fontSize: '1.8rem',
            marginBottom: '1rem',
          }}>
            Our Services
          </h2>
          <ul>
            <li>Web Design</li>
            <li>Mobile App Development</li>
            <li>Cloud Solutions</li>
            <li>Digital Marketing</li>
          </ul>
        </section>
      </main>
      <footer style={{ marginTop: '2rem', textAlign: 'center' as const }}>
        <p>&copy; 2023 Our Company. All rights reserved.</p>
      </footer>
    </div>
  );
};

