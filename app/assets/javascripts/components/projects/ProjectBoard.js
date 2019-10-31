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
import { projectBoardPropTypesShape } from '../../models/beta/projectBoard';
import Notifications from '../Notifications';
import { removeNotification } from '../../actions/notifications';
import StorySearch from '../search/StorySearch';
import SearchResults from './../search/SearchResults';
import ProjectLoading from './ProjectLoading';
import { DragDropContext } from 'react-beautiful-dnd'

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
    setNewBacklogSprints(backlogSprints)
  }, [backlogSprints]);

  useEffect(() => {
    setNewChillyBinStories(chillyBinStories);
  }, [chillyBinStories]);

  useEffect(() => {
    fetchProjectBoard(projectId);
  }, []);

  const calculatePosition = (aboveStory, bellowStory) => {
    if (bellowStory === undefined) return (Number(aboveStory.position) + 1);
    if (aboveStory === undefined) return (Number(bellowStory.position) - 1);
    return (Number(bellowStory.position) + Number(aboveStory.position)) / 2;
  }

  const getNewPosition = (destinatitonIndex, sourceIndex, storiesArray, isSameColumn, storyType) => {
    //TODO: remove this second condition later
    if (!isSameColumn && storyType !== 'feature') {
      return calculatePosition(storiesArray[destinatitonIndex - 1], storiesArray[destinatitonIndex]);
    }
    if (sourceIndex > destinatitonIndex) {
      return calculatePosition(storiesArray[destinatitonIndex - 1], storiesArray[destinatitonIndex]);
    }
    return calculatePosition(storiesArray[destinatitonIndex], storiesArray[destinatitonIndex + 1]);
  }

  const getArray = column => column === 'chillyBin' ? chillyBinStories : backlogSprints[0].stories;

  const getState = column => column === 'chillyBin' ? Story.status.UNSCHEDULED : Story.status.UNSTARTED

  const moveTaskToSameColum = (stories, sourceIndex, destinationIndex) => {
    const newStories = stories;
    const [removed] = newStories.splice(sourceIndex, 1);
    newStories.splice(destinationIndex, 0, removed);
    return [...newStories];
  }

  const moveTaskToAnotherColumn = (sourceArray, destinationArray, source, destination) => {
    const newSourceArray = sourceArray;
    const [removed] = newSourceArray.splice(source.index, 1);
    const newDestinationArray = destinationArray;
    newDestinationArray.splice(destination.index, 0, removed);
    return setNewColumns([...newDestinationArray], source.droppableId);
  }

  const getNewSprints = (newStories) => newBacklogSprints.map((sprint, index) => index === 0 ? { ...sprint, stories: newStories } : sprint)

  const setNewColumns = (newDestinationArray, sourceColumn) => {
    if (sourceColumn === 'backlog') {
      return setNewChillyBinStories(newDestinationArray);
    }
    return setNewBacklogSprints(getNewSprints(newDestinationArray));
  }

  const onDragEnd = result => {
    const { destination, source, draggableId } = result;
    const destinationArray = getArray(destination.droppableId); // stories of destination column
    const sourceArray = getArray(source.droppableId); // stories of source column
    const isSameColumn = source.droppableId === destination.droppableId;
    const isEqualToColumn = column => destination.droppableId === column && source.droppableId === column
    const dragStory = sourceArray[source.index];

    if (!destination) {
      return;
    }

    if (isSameColumn && source.index === destination.index) {
      return;
    }

    const newPosition = getNewPosition(destination.index, source.index, destinationArray, isSameColumn, dragStory.storyType);

    // Changing the column array order
    if (isEqualToColumn('chillyBin')) {
      setNewChillyBinStories(moveTaskToSameColum(newChillyBinStories, source.index, destination.index));
    }

    if (isEqualToColumn('backlog')) {
      const newColumn = moveTaskToSameColum(newBacklogSprints[0].stories, source.index, destination.index);
      setNewBacklogSprints(getNewSprints(newColumn));
    }

    if (!isSameColumn) {
      moveTaskToAnotherColumn(sourceArray, destinationArray, source, destination);
    }

    // Persisting the new array order 
    // Moving to same column
    if (isSameColumn) {
      return dragDropStory(dragStory.id, dragStory.projectId, { position: newPosition });
    }

    // Moving to a different column
    const newState = getState(destination.droppableId);
    return dragDropStory(dragStory.id, dragStory.projectId, { position: newPosition, state: newState });
  }

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

