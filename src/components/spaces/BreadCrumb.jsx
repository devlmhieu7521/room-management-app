import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/breadcrumb.css';

/**
 * Breadcrumb Component
 *
 * @param {Array} items - Array of breadcrumb items with label and link properties
 */
const Breadcrumb = ({ items = [] }) => {
  return (
    <div className="breadcrumb">
      {items.map((item, index) => (
        <span key={index} className="breadcrumb-item">
          {index < items.length - 1 ? (
            <React.Fragment>
              {item.link ? (
                <Link to={item.link}>{item.label}</Link>
              ) : (
                <span className="breadcrumb-text">{item.label}</span>
              )}
              <span className="breadcrumb-separator"> &gt; </span>
            </React.Fragment>
          ) : (
            <span className="breadcrumb-active">{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
};

export default Breadcrumb;