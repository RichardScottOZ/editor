/* eslint-disable react/prop-types */
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Typography, makeStyles, createStyles } from '@material-ui/core';
import isEqual from 'lodash.isequal';
import { State, Dispatch } from '../../store/types';
import { selectors, actions } from '../../store';
import Suggestion from './Suggestion';
import { CommandResult } from '../../store/suggestion/commands';

const useStyles = makeStyles(() => createStyles({
  root: {
    position: 'relative',
    '& div': {
      position: 'absolute',
      padding: '0 3px',
      border: '1px solid #FFF',
      fontFamily: 'system-ui, "Noto Sans"',
      fontSize: 12,
      color: '#5f5f5f',
      top: 3,
      right: 3,
      backgroundColor: '#D4D4D4',
      borderRadius: 3,
    },
    '& h6': {
      marginRight: 50,
    },
    '& span': {
      margin: 5,
      marginRight: 50,
    },
  },
}));


const CommandSuggestions = () => {
  const dispatch = useDispatch<Dispatch>();

  const suggestions = useSelector(
    (state: State) => selectors.getSuggestion(state), isEqual,
  );
  const { selected, results } = suggestions as {selected: number; results: CommandResult[]};

  const onClick = (index: number) => dispatch(actions.chooseSelection(index));
  const onHover = (index: number) => dispatch(actions.selectSuggestion(index));

  const classes = useStyles();
  return (
    <div>
      {results.map(((item, index) => (
        <Suggestion
          key={item.name}
          onClick={() => onClick(index)}
          onHover={() => onHover(index)}
          selected={selected === index}
          className={classes.root}
        >
          {item.shortcut && <div>{item.shortcut}</div>}
          <Typography variant="subtitle1">
            {item.title}
          </Typography>
          <Typography variant="caption">
            {item.description}
          </Typography>
        </Suggestion>
      )))}
    </div>
  );
};

export default CommandSuggestions;
