import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { DragDropContext } from 'react-beautiful-dnd';
import { fetchProjectBoard } from "actions/projectBoard";
import { fetchPastStories } from "actions/pastIterations";
import Column from "../Columns/ColumnItem";
import Stories from "../stories/Stories";
import Sprints from "../stories/Sprints";
import History from "../stories/History";
import { getColumns } from "../../selectors/columns";
import * as Columns from '../../models/beta/column';
import { createStory, closeHistory, dragDropStory } from '../../actions/story';
import AddStoryButton from '../story/AddStoryButton';
import * as Story from 'libs/beta/constants';
import PropTypes from 'prop-types';
import { storyPropTypesShape } from '../../models/beta/story';
import {
  projectBoardPropTypesShape,
  getNewPosition,
  getNewSprints,
  getNewState,
  moveTask,
  getBacklogStories,
  getArray
} from '../../models/beta/projectBoard';
import Notifications from '../Notifications';
import { removeNotification } from '../../actions/notifications';
import StorySearch from '../search/StorySearch';
import SearchResults from './../search/SearchResults';
import ProjectLoading from './ProjectLoading';

const ProjectBoard = ({
  projectId,
  createStory,
  closeHistory,
  notifications,
  removeNotification,
  history,
  projectBoard,
  fetchProjectBoard,
  dragDropStory,
  chillyBinStories,
  backlogSprints,
  doneSprints,
  fetchPastStories
}) => {
  const [newChillyBinStories, setNewChillyBinStories] = useState();
  const [newBacklogSprints, setNewBacklogSprints] = useState();

  useEffect(() => {
    setNewBacklogSprints(backlogSprints);
  }, [backlogSprints]);

  useEffect(() => {
    setNewChillyBinStories(chillyBinStories);
  }, [chillyBinStories]);

  useEffect(() => {
    fetchProjectBoard(projectId);
  }, [fetchProjectBoard, projectId]);

  const onDragEnd = ({ source, destination, draggableId }) => {
    const { sprintIndex: sprintDropIndex, columnId: dropColumn } = JSON.parse(destination.droppableId);
    const { sprintIndex: sprintDragIndex, columnId: dragColumn } = JSON.parse(source.droppableId);
    const { index: sourceIndex } = source;
    const { index: destinationIndex} = destination;
    const isSameColumn = dragColumn === dropColumn;
    const destinationArray = getArray(dropColumn, newBacklogSprints, newChillyBinStories, sprintDropIndex); // stories of destination column
    const sourceArray = getArray(dragColumn, newBacklogSprints, newChillyBinStories, sprintDragIndex); // stories of source column
    const dragStory = sourceArray[sourceIndex];

    if (!destination) {
      return;
    }

    if (isSameColumn && sourceIndex === destinationIndex) {
      return;
    }

    const newPosition = getNewPosition(
      destinationIndex,
      sourceIndex,
      destinationArray,
      isSameColumn,
      dragStory.storyType,
    );

    const newStories = moveTask(
      sourceArray,
      destinationArray,
      sourceIndex,
      destinationIndex,
    );

    // Changing the column array order
    if (dropColumn === 'chillyBin') {
      setNewChillyBinStories(newStories);
    }

    if (dropColumn === 'backlog') {
      setNewBacklogSprints(getNewSprints(newStories, newBacklogSprints, sprintDropIndex));
    }

    // Persisting the new array order
    const newState = getNewState(isSameColumn, dropColumn, dragStory.state);
    return dragDropStory(dragStory.id, dragStory.projectId, {
      position: newPosition,
      state: newState,
    });
  };

  if (!projectBoard.isFetched) {
    return <b>{I18n.t('loading')}</b>;
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="ProjectBoard">
        <StorySearch projectId={projectId} loading={projectBoard.search.loading} />

        <Notifications
          notifications={notifications}
          onRemove={removeNotification}
        />

        <Column title={I18n.t("projects.show.chilly_bin")}
          renderAction={() =>
            <AddStoryButton
              onAdd={() => createStory({
                state: Story.status.UNSCHEDULED
              })}
            />
          }
        >
          <Stories stories={newChillyBinStories} columnId='chillyBin' />
        </Column>

        <Column
          title={`${I18n.t("projects.show.backlog")} /
          ${I18n.t("projects.show.in_progress")}`}
          renderAction={() =>
            <AddStoryButton
              onAdd={() => createStory({
                state: Story.status.UNSTARTED
              })}
            />}
        >
          <Sprints
            sprints={newBacklogSprints}
            columnId='backlog'
          />
        </Column>

        <Column
          title={I18n.t("projects.show.done")}
        >
          <Sprints
            sprints={doneSprints}
            fetchStories={fetchPastStories}
            columnId='done'
          />
        </Column>

        <SearchResults />

        {
          history.status !== 'DISABLED' &&
          <Column
            onClose={closeHistory}
            title={[I18n.t("projects.show.history"), "'", history.storyTitle, "'"].join(' ')}
          >
            {history.status === 'LOADED'
              ? <History history={history.activities} />
              : <div className="loading">Loading...</div>
            }
          </Column>
        }
      </div>
    </DragDropContext>
  );
}

ProjectBoard.propTypes = {
  projectBoard: projectBoardPropTypesShape.isRequired,
  chillyBinStories: PropTypes.arrayOf(storyPropTypesShape),
  doneSprints: PropTypes.array.isRequired,
  backlogSprints: PropTypes.array.isRequired,
  fetchProjectBoard: PropTypes.func.isRequired,
  createStory: PropTypes.func.isRequired,
  closeHistory: PropTypes.func.isRequired,
  notifications: PropTypes.array.isRequired
}

const mapStateToProps = ({
  projectBoard,
  project,
  stories,
  history,
  pastIterations,
  notifications
}) => ({
  projectBoard,
  history,
  chillyBinStories: getColumns({
    column: Columns.CHILLY_BIN,
    stories
  }),
  backlogSprints: getColumns({
    column: Columns.BACKLOG,
    stories,
    project,
    pastIterations
  }),
  doneSprints: getColumns({
    column: Columns.DONE,
    pastIterations,
    stories
  }),
  stories,
  notifications
});

const mapDispatchToProps = {
  fetchProjectBoard,
  createStory,
  closeHistory,
  fetchPastStories,
  removeNotification,
  dragDropStory
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProjectBoard);

