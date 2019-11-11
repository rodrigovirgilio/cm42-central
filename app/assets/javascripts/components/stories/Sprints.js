import React from 'react';
import PropTypes from 'prop-types';
import Sprint from './Sprint';
import { Droppable } from 'react-beautiful-dnd';

const propTypes = {
  sprints: PropTypes.array,
};

const defaultProps = {
  sprints: [],
};

const droppableContainer = (sprints, fetchStories, columnId) => (
  <Droppable droppableId={JSON.stringify({columnId, sprintIndex: 0})} isDropDisabled={columnId === 'done'}>
    {provided => (
      <div className='Sprints' ref={provided.innerRef} {...provided.droppableProps}>
        {renderSprints(sprints, fetchStories, columnId)}
        {provided.placeholder}
      </div>
    )}
  </Droppable>
);

const renderSprints = (sprints, fetchStories, columnId) => {
  return sprints.map((sprint, index) => (
    <Sprint
      key={sprint.number}
      sprint={sprint}
      sprintIndex={index}
      columnId={columnId}
      fetchStories={fetchStories}
    />
  ));
};

const Sprints = ({ sprints, fetchStories, columnId }) => {
  return (
    <div className='Sprints' data-cy={!columnId ? 'sprints' : null}>
      {sprints.length === 0
        ? droppableContainer(sprints, fetchStories, columnId)
        : renderSprints(sprints, fetchStories, columnId)
      }
    </div>
  );
};

Sprint.propTypes = propTypes;
Sprint.defaultProps = defaultProps;

export default Sprints;
