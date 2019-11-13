import React, { Fragment } from "react";
import { Droppable } from "react-beautiful-dnd";
import PropTypes from "prop-types";
import StoryItem from "../story/StoryItem";
import { storyPropTypesShape } from "./../../models/beta/story";

const isDropDisabled = column => column === "done" || column === "search";

const Stories = ({ stories, from, sprintIndex, columnId }) => {
  return (
    <Droppable
      droppableId={JSON.stringify({ columnId, sprintIndex })}
      isDropDisabled={isDropDisabled(columnId)}
    >
      {provided => (
        <div
          className="Column__body"
          ref={provided.innerRef}
          {...provided.droppableProps}
        >
          {stories.map((story, index) => (
            <StoryItem
              key={story.id}
              story={story}
              from={from}
              index={index}
              sprintIndex={sprintIndex}
              columnId={columnId}
            />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

Stories.propTypes = {
  stories: PropTypes.arrayOf(storyPropTypesShape),
  from: PropTypes.string
};

export default Stories;
