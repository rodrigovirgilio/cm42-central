import React from 'react';
import PropTypes from 'prop-types';
import { Droppable } from 'react-beautiful-dnd'

const Column = ({ title, children, renderAction, onClose, columnId }) => (
  <Droppable droppableId={columnId} isDropDisabled={columnId === 'done'}>
    {provided => (
      <div className="Column" ref={provided.innerRef} {...provided.droppableProps}>
        <div className="Column__header">
          <h3 className="Column__name">{title}</h3>
          <div className="Column__actions">
            {renderAction()}
            <button type="button" className="Column__btn-close" onClick={onClose}>
              <i className="mi md-light md-16">close</i>
            </button>
          </div>
        </div>
        <div className="Column__body">
          {children}
        </div>
        {provided.placeholder}
      </div>
    )}
  </Droppable>
);

Column.propTypes = {
  title: PropTypes.string.isRequired,
  renderAction: PropTypes.func
}

Column.defaultProps = {
  renderAction: () => null
}

export default Column;
