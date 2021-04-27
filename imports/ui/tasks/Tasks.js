import { Meteor } from 'meteor/meteor';
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import {
  Box,
  Button,
  Heading,
  Stack,
  Text,
  Spinner,
  useColorModeValue,
  HStack,
} from '@chakra-ui/react';
import { Task } from './Task';
import { TasksCollection } from '../../db/TasksCollection';
import { TaskForm } from './TaskForm';
import { useTracker } from 'meteor/react-meteor-data';
import { Statistic, Row, Col } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import {
  XYPlot,
  XAxis,
  YAxis,
  VerticalGridLines,
  HorizontalGridLines,
  VerticalBarSeries,
  makeWidthFlexible,
  RadialChart,
} from 'react-vis';
import './Tasks.css';

export const Tasks = ({ user }) => {
  const [hideDone, setHideDone] = useState(false);
  // Track if all, pending or completed increased or decreased [old value : number, new value : number]
  const [allChange, setAllChange] = useState([]);
  const [pendingChange, setPendingChange] = useState([]);
  const [completedChange, setCompletedChange] = useState([]);
  const firstUpdate = useRef(true);
  const doneFilter = { done: { $ne: true } };
  const userFilter = user ? { userId: user._id } : {};
  const pendingOnlyFilter = { ...doneFilter, ...userFilter };

  const { tasks, pendingCount, finshedCount, allCount, isLoading } = useTracker(
    () => {
      const noDataAvailable = { tasks: [], pendingCount: 0, allCount: 0 };
      if (!Meteor.user()) {
        return noDataAvailable;
      }
      const handler = Meteor.subscribe('tasks');

      if (!handler.ready()) {
        return { ...noDataAvailable, isLoading: true };
      }

      const tasksData = TasksCollection.find(
        hideDone ? pendingOnlyFilter : userFilter,
        {
          sort: { createdAt: -1 },
        }
      ).fetch();

      const pending = TasksCollection.find(pendingOnlyFilter).count();
      const all = TasksCollection.find({}).count();
      const finshed = all - pending;
      return {
        tasks: tasksData,
        pendingCount: pending,
        allCount: all,
        finshedCount: finshed,
      };
    }
  );
  // Graphs
  const FlexibleXYPlot = makeWidthFlexible(XYPlot);
  const FlexibleRadialChart = makeWidthFlexible(RadialChart);
  const pieData = [
    {
      angle: pendingCount,
      radius: 30,
      label: 'Pending',
      subLabel: pendingCount,
    },
    {
      angle: finshedCount,
      radius: 30,
      label: 'Completed',
      subLabel: finshedCount,
    },
  ];
  const colors = ['#BA1200', '#4E5AC0', '#1EE19C'];

  useLayoutEffect(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false;

      // Component Didmount
      // setPendingChange(pendingCount);
      // setCompletedChange(finshedCount);

      // console.log(pendingChange)
      // console.log(completedChange)
    }

    // Component Will Update
    // console.log('pendingCount', pendingCount);
    // console.log('finshedCount', finshedCount);
    // console.log('allCount', allCount);
    const AllChangeArrMap = allChange;
    const pedingChangeArrMap = pendingChange;
    const completedChangeArrMap = completedChange;

    AllChangeArrMap.push(allCount);
    pedingChangeArrMap.push(pendingCount);
    completedChangeArrMap.push(finshedCount);

    if (AllChangeArrMap.length > 2) {
      AllChangeArrMap.shift();
    }
    if (pedingChangeArrMap.length > 2) {
      pedingChangeArrMap.shift();
    }
    if (completedChangeArrMap.length > 2) {
      completedChangeArrMap.shift();
    }

    // console.log(pedingChangeArrMap);
    // console.log(completedChangeArrMap);
    setAllChange(AllChangeArrMap);
    setPendingChange(pedingChangeArrMap);
    setCompletedChange(completedChangeArrMap);
  }, [pendingCount, finshedCount, allCount]);

  useEffect(
    () =>
      // Component Will Unmount
      function cleanup() {}
  );

  const markAsDone = ({ _id, done }) =>
    Meteor.call('tasks.setDone', _id, !done);

  const deleteTask = ({ _id }) => Meteor.call('tasks.remove', _id);

  const Header = () => (
    <Stack as={Box} textAlign="center" spacing={{ base: 8 }} py={{ base: 10 }}>
      <Heading fontWeight={600}>
        <Text
          as="span"
          bgGradient="linear(to-l, #675AAA, #4399E1)"
          bgClip="text"
        >
          Simple Task
        </Text>
      </Heading>
    </Stack>
  );

  const EmptyTasks = () => (
    <Stack justify="center" direction="row">
      <Text color="gray.400" fontSize="xl">
        Add your first task above.
      </Text>
    </Stack>
  );

  if (allCount === 0) {
    return (
      <>
        <Header />
        <TaskForm />
        <EmptyTasks />
      </>
    );
  }

  return (
    <>
      <Header />
      <Row>
        <Col
          className="graph__container mt10px"
          xs={24}
          sm={24}
          md={12}
          lg={12}
          xl={12}
        >
          <span className="dot-pending" />
          <span className="pending-title">Pending - </span>
          <span className="dot-completed" />
          <span className="completed-title">Completed - </span>
          <span className="dot-all" />
          <span className="all-title">All - </span>
          <FlexibleXYPlot margin={{ bottom: 70 }} xType="ordinal" height={350}>
            <VerticalGridLines />
            <HorizontalGridLines />
            <XAxis tickLabelAngle={0} />
            <YAxis />
            <VerticalBarSeries
              color="#4E5AC0"
              data={[{ x: 'Pending', y: pendingCount }]}
            />
            <VerticalBarSeries
              color="#1EE19C"
              data={[{ x: 'Completed', y: finshedCount }]}
            />
            <VerticalBarSeries
              color="#BA1200"
              data={[{ x: 'All', y: allCount }]}
            />
          </FlexibleXYPlot>
          <br />
        </Col>
        <Col
          className="graph__container mt10px"
          xs={24}
          sm={24}
          md={12}
          lg={12}
          xl={12}
        >
          <FlexibleRadialChart
            // color={"#F89833"}
            // colorType={'category'}
            colorRange={colors}
            stroke="#ffffff"
            data={pieData}
            height={350}
            showLabels
          />
        </Col>
      </Row>
      <div className="site-statistic-demo-card graph__container mt10px">
        <Row className="mt10px">
          <Col
            xs={12}
            sm={12}
            md={12}
            lg={12}
            xl={12}
            className="widget-wrapper text-align-center"
          >
            <InfoCircleOutlined />
            <Statistic
              title="All"
              value={allCount}
              precision={2}
              valueStyle={
                allChange[1] > allChange[0]
                  ? { color: '#3f8600' }
                  : { color: '#cf1322' }
              }
              prefix={
                allChange[1] > allChange[0] ? (
                  <ArrowUpOutlined />
                ) : (
                  <ArrowDownOutlined />
                )
              }
              suffix=""
            />
          </Col>
          <Col
            xs={12}
            sm={12}
            md={12}
            lg={12}
            xl={12}
            className="widget-wrapper text-align-center"
          >
            <ClockCircleOutlined />
            <Statistic
              title="Pending"
              value={pendingCount}
              precision={2}
              valueStyle={
                pendingChange[1] > pendingChange[0]
                  ? { color: '#3f8600' }
                  : { color: '#cf1322' }
              }
              prefix={
                pendingChange[1] > pendingChange[0] ? (
                  <ArrowUpOutlined />
                ) : (
                  <ArrowDownOutlined />
                )
              }
              suffix=""
            />
          </Col>
          <Col
            xs={12}
            sm={12}
            md={12}
            lg={12}
            xl={12}
            className="widget-wrapper text-align-center"
          >
            <CheckCircleOutlined />
            <Statistic
              title="Completed"
              value={finshedCount}
              precision={2}
              valueStyle={
                pendingChange[1] < pendingChange[0]
                  ? { color: '#3f8600' }
                  : { color: '#cf1322' }
              }
              prefix={
                pendingChange[1] < pendingChange[0] ? (
                  <ArrowUpOutlined />
                ) : (
                  <ArrowDownOutlined />
                )
              }
              suffix=""
            />
          </Col>
        </Row>
      </div>
      <TaskForm />
      {isLoading ? (
        <Spinner />
      ) : (
        <Box
          py={{ base: 2 }}
          px={{ base: 4 }}
          pb={{ base: 4 }}
          border={1}
          borderStyle="solid"
          borderRadius="md"
          borderColor={useColorModeValue('gray.200', 'gray.700')}
        >
          <HStack mt={2}>
            <Box w="70%">
              <Text
                as="span"
                color={useColorModeValue('gray.500', 'gray.400')}
                fontSize="xs"
              >
                You have {allCount} {allCount === 1 ? 'task ' : 'tasks '}
                and {pendingCount} pending.
              </Text>
            </Box>
            <Stack w="30%" justify="flex-end" direction="row">
              <Button
                colorScheme="teal"
                size="xs"
                onClick={() => setHideDone(!hideDone)}
              >
                {hideDone ? 'Show All Tasks' : 'Show Pending'}
              </Button>
            </Stack>
          </HStack>

          {tasks.map(task => (
            <Task
              key={task._id}
              task={task}
              onMarkAsDone={markAsDone}
              onDelete={deleteTask}
            />
          ))}
        </Box>
      )}
    </>
  );
};
