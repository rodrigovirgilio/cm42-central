import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
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
  moveTask
} from '../../models/beta/projectBoard';
import Notifications from '../Notifications';
import { removeNotification } from '../../actions/notifications';
import StorySearch from '../search/StorySearch';
import SearchResults from './../search/SearchResults';
import ProjectLoading from './ProjectLoading';
import { DragDropContext } from 'react-beautiful-dnd';

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
  }, []);

  const onDragEnd = ({ destination, source }) => {
    const isSameColumn = source.droppableId === destination.droppableId;
    const getArray = column =>
      column === 'chillyBin'
        ? newChillyBinStories
        : newBacklogSprints[0].stories;
    const destinationArray = getArray(destination.droppableId); // stories of destination column
    const sourceArray = getArray(source.droppableId); // stories of source column
    const dragStory = sourceArray[source.index];

    if (!destination) {
      return;
    }

    if (isSameColumn && source.index === destination.index) {
      return;
    }

    const newPosition = getNewPosition(
      destination.index,
      source.index,
      destinationArray,
      isSameColumn,
      dragStory.storyType,
    );

    // Changing the column array order
    if (destination.droppableId === 'chillyBin') {
      setNewChillyBinStories(
        moveTask(
          sourceArray,
          destinationArray,
          source.index,
          destination.index,
        ),
      );
    }

    if (destination.droppableId === 'backlog') {
      const newStories = moveTask(
        sourceArray,
        destinationArray,
        source.index,
        destination.index,
      );
      setNewBacklogSprints(getNewSprints(newStories, newBacklogSprints));
    }

    // Persisting the new array order
    const newState = getNewState(destination.droppableId);
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
          columnId={'chillyBin'}
        >
          <Stories stories={newChillyBinStories} columnId={'chillyBin'} />
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
          columnId={'backlog'}
        >
          <Sprints
            sprints={newBacklogSprints}
            columnId='backlog'
          />
        </Column>

        <Column
          title={I18n.t("projects.show.done")}
          columnId={'done'}
        >
          <Sprints
            sprints={doneSprints}
            fetchStories={fetchPastStories}
            columnId={'done'}
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

